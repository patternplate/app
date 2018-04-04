import * as Fs from "fs";
import * as Path from "path";
import * as ChildProcess from "child_process";
import * as uuid from "uuid";
import * as semver from "semver";
import * as loadJsonFile from "load-json-file";

import {Channel} from "./nextable";
import * as Msg from "../messages";

const ARSON = require("arson");
const readPkg = require("read-pkg");
const loadConfig = require("@patternplate/load-config");
const resolveFrom = require("resolve-from");

const PREFIX = require("find-up").sync("node_modules", {cwd: __dirname});

require("yarn/package");
require("npm/package");
require("@patternplate/cli/package");
require("get-port-cli/package");

const YARN = Path.join(PREFIX, ".bin", "yarn");
const NPM = Path.join(PREFIX, ".bin", "npm");
const PATTERNPLATE = Path.join(PREFIX, ".bin", "patternplate");
const GET_PORT = Path.join(PREFIX, ".bin", "get-port");

export interface Installable extends Channel {
  id: string;
  basePath: string;
  path: string;
}

export class Modules<T extends Installable> {
  public readonly host: T;

  private cp: ChildProcess.ChildProcess | null = null;

  public constructor(host: T) {
    this.host = host;

    this.host.down.subscribe((message: any) => {
      const match = Msg.match(message);
      match(Msg.Modules.ModulesInstallRequest, () => this.install());
      match(Msg.Modules.ModulesBuildRequest, () => this.build());
      match(Msg.Modules.ModulesConfigureRequest, () => this.configure());
      match(Msg.Modules.ModulesStartRequest, () => this.start(message));
      match(Msg.Modules.ModulesStopRequest, () => this.stop());
    });
  }

  private installer() {
    return Fs.existsSync(Path.join(this.host.path, "yarn.lock")) ? YARN : NPM;
  }

  private install() {
    const id = uuid.v4();
    this.host.up.next(new Msg.Modules.ModulesInstallStartNotification(id));

    const cp = ChildProcess.fork(this.installer(), ["install", "--verbose"], {
      cwd: this.host.path,
      stdio: ["ipc", "pipe", "pipe"]
    });

    cp.stderr.on("data", (data) => {
      console.log(String(data));
    });

    cp.stdout.on("data", (data) => {
      console.log(String(data));
    });

    const onEnd = (code: number) => {
      if (code !== 0) {
        return this.host.up.next(new Msg.Modules.ModulesInstallErrorNotification(id));
      }

      this.host.up.next(new Msg.Modules.ModulesInstallEndNotification(id));
    }

    cp.once("close", onEnd);
    cp.once("exit", onEnd);
  }

  private configure() {
    const id = uuid.v4();

    loadConfig({ cwd: this.host.path })
      .then((config: any) => {
        return this.host.up.next(new Msg.Modules.ModulesConfigureResponse(id, config));
      })
      .catch((err: Error) => {
        console.error(err);
      });
  }

  private build() {
    const id = uuid.v4();
    this.host.up.next(new Msg.Modules.ModulesBuildStartNotification(id));
    const pkg = readPkg.sync(this.host.path);
    const scripts = pkg.scripts || {};

    if (!scripts.hasOwnProperty("build") && !scripts.hasOwnProperty("patternplate:build")) {
      this.host.up.next(new Msg.Modules.ModulesBuildEndNotification(id));
      return;
    }

    const runScript = scripts.hasOwnProperty("patternplate:build")
      ? "patternplate:build"
      : "build";

    const cp = ChildProcess.fork(this.installer(), ["run", runScript], {
      cwd: this.host.path,
      stdio: ["ipc", "pipe", "pipe"]
    });

    cp.stderr.on("data", (data) => {
      console.log(String(data));
    });

    cp.stdout.on("data", (data) => {
      console.log(String(data));
    });

    cp.on("exit", (code) => {
      if (code !== 0) {
        return this.host.up.next(new Msg.Modules.ModulesBuildErrorNotification(id));
      }
      this.host.up.next(new Msg.Modules.ModulesBuildEndNotification(id));
    });
  }

  private start(request: Msg.Modules.ModulesStartRequest) {
    const id = uuid.v4();
    this.host.up.next(new Msg.Modules.ModulesStartStartNotification(id));

    getPort()
      .catch((err: Error) => {
        // TODO: Emit cricital error here
        console.error(err);
      })
      .then((port) => {
        if (typeof port !== "number") {
          // TODO: Emit cricital error here
          console.error("Failed to get open port");
          return;
        }

        this.host.up.next(new Msg.Modules.ModulesStartPortNotification(id, port));

        const pp = getExectuable({
          cwd: this.host.path
        });

        this.cp = ChildProcess.fork(pp, [
          "start", "--port", `${port}`, "--cwd", `${this.host.path}`
        ], {
          stdio: ["pipe", "pipe", "pipe", "ipc"]
        });

        this.cp.on("message", (envelope: any) => {
          const instance = ARSON.parse(envelope);
          if (instance.type === "patternplate:started") {
            const port = instance.payload.port as number;
            const cwd = instance.payload.cwd as string;

            this.host.up.next(new Msg.Modules.ModulesStartStartedNotification(id, this.host.id, {
              port,
              cwd,
              open: request.open
            }));
          }
        });

        const stderr: any[] = [];

        this.cp.stdout.on("data", (data: any) => {
          console.log(String(data));
        });

        this.cp.stderr.on("data", (data: any) => {
          console.log(String(data));
          stderr.push(String(data));
        });

        this.cp.on("exit", (code) => {
          if (code && code !== 0) {
            this.host.up.next(new Msg.Modules.ModulesStartErrorNotification(id));
            console.error(`patternplate exited with code ${code}:\n${stderr.join("\n")}`);
          }
        });

        this.cp.on("error", (err) => {
          this.host.up.next(new Msg.Modules.ModulesStartErrorNotification(id));
          console.error(`patternplate start failed: `, err);
        });
      });
  }

  private stop() {
    if (!this.cp) {
      return;
    }

    const id = uuid.v4();
    this.host.up.next(new Msg.Modules.ModulesStopNotification(id))
    this.cp.kill("SIGTERM");
    this.host.up.next(new Msg.Modules.ModulesStopEndNotification(id))
  }

  public getBuild(buildPath: string): Promise<string> {
    const pp = getExectuable({ cwd: this.host.path });

    const cp = ChildProcess.fork(pp, ["build", "--base", "/", "--out", buildPath, "--cwd", this.host.path], {
      stdio: ["pipe", "inherit", "inherit", "ipc"],
      cwd: this.host.path
    });

    return new Promise((resolve, reject) => {
      const onEnd = (code: number) => {
        if (code === 0) {
          console.log({buildPath});
          resolve(buildPath);
        }
      };

      cp.once("error", reject);
      cp.once("end", onEnd);
      cp.once("close", onEnd);
    });
  }
}

function getPort() {
  return new Promise((resolve, reject) => {
    const cp = ChildProcess.fork(GET_PORT, [], {
      stdio: ["ipc", "pipe", "pipe"]
    });

    let stdout = "";

    cp.stdout.on("data", (data) => {
      stdout += data;
    });

    cp.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error("get-port failed"));
      }
      resolve(Number(stdout));
    });
  });
}

interface ExecOpts {
  cwd: string;
}

function getExectuable({cwd}: ExecOpts): string {
  const resolved = resolveFrom.silent(cwd, "@patternplate/cli/package");

  if (!resolved) {
    return PATTERNPLATE;
  }

  const pkg = attempt(resolved);

  if (!pkg) {
    return PATTERNPLATE;
  }

  const {version = ''} = pkg;

  if (semver.lt(version, "2.0.4")) {
    return PATTERNPLATE;
  }

  return Path.join(Path.dirname(resolved), pkg.bin.patternplate);
}

function attempt(path: string): any {
  try {
    return loadJsonFile.sync(path);
  } catch (err) {
    console.error(err);
    return null;
  }
}
