import * as Fs from "fs";
import * as Path from "path";
import * as ChildProcess from "child_process";
import * as execa from "execa";
import * as uuid from "uuid";

import {Channel} from "./nextable";
import * as Msg from "../messages";

const ARSON = require("arson");
const readPkg = require("read-pkg");

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
      match(Msg.Modules.ModulesStartRequest, () => this.start());
      match(Msg.Modules.ModulesStopRequest, () => this.stop());
    });
  }

  private installer() {
    return Fs.existsSync(Path.join(this.host.path, "yarn.lock")) ? YARN : NPM;
  }

  private install() {
    const id = uuid.v4();
    this.host.up.next(new Msg.Modules.ModulesInstallStartNotification(id));

    const cp = execa(this.installer(), ["install", "--verbose"], {
      cwd: this.host.path,
      maxBuffer: Infinity
    });

    cp.stderr.on("data", (data) => {
      console.log(String(data));
    });

    cp.stdout.on("data", (data) => {
      console.log(String(data));
    });

    cp.then((result) => {
      this.host.up.next(new Msg.Modules.ModulesInstallEndNotification(id));
    }).catch((err) => {
      this.host.up.next(new Msg.Modules.ModulesInstallErrorNotification(id));
      console.log({err});
    });
  }

  private build() {
    const id = uuid.v4();
    this.host.up.next(new Msg.Modules.ModulesBuildStartNotification(id));
    const pkg = readPkg.sync(this.host.path);
    const scripts = pkg.scripts || {};

    if (!scripts.hasOwnProperty("build")) {
      this.host.up.next(new Msg.Modules.ModulesBuildEndNotification(id));
      return;
    }

    const cp = execa(this.installer(), ["run", "build"], {cwd: this.host.path});

    cp.stderr.on("data", (data) => {
      console.log(String(data));
    });

    cp.stdout.on("data", (data) => {
      console.log(String(data));
    });

    cp.then((result) => {
      this.host.up.next(new Msg.Modules.ModulesBuildEndNotification(id));
    }).catch((err) => {
      this.host.up.next(new Msg.Modules.ModulesBuildErrorNotification(id));
      console.log({err});
    });
  }

  private start() {
    const id = uuid.v4();
    this.host.up.next(new Msg.Modules.ModulesStartStartNotification(id));

    execa(GET_PORT)
      .catch((err: Error) => {
        // TODO: Emit cricital error here
        console.error(err);
      })
      .then((result) => {
        if (!result) {
          // TODO: Emit cricital error here
          console.error("Failed to get open port");
          return;
        }

        const port = Number(result.stdout);
        this.host.up.next(new Msg.Modules.ModulesStartPortNotification(id, port));

        this.cp = ChildProcess.fork(PATTERNPLATE, ["start", "--port", `${port}`], {cwd: this.host.path});

        this.cp.on("message", (envelope: any) => {
          const instance = ARSON.parse(envelope);
          if (instance.type === "patternplate:started") {
            const port = instance.payload.port as number;
            const cwd = instance.payload.cwd as string;

            this.host.up.next(new Msg.Modules.ModulesStartStartedNotification(id, {
              port,
              cwd
            }));
          }
        });

        this.cp.on("error", (err) => {
          this.host.up.next(new Msg.Modules.ModulesStartErrorNotification(id));
          console.error(err);
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
}
