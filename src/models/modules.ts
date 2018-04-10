import * as Fs from "fs";
import * as Path from "path";
import * as ChildProcess from "child_process";
import * as uuid from "uuid";
import {BehaviorSubject} from "rxjs";

import {Channel} from "./nextable";
import * as Msg from "../messages";
import {fork, Forked} from "../fork";

const ARSON = require("arson");
const execa = require("execa");
const readPkg = require("read-pkg");
const loadConfig = require("@patternplate/load-config");
const getPort = require("get-port");

export interface Installable extends Channel {
  id: string;
  basePath: string;
  path: string;
}

export class Modules<T extends Installable> {
  public readonly host: T;

  private cp?: Forked;
  private watch?: Forked;
  private interval?: NodeJS.Timer;
  private appReady: BehaviorSubject<boolean>;
  private stopped: boolean = false;

  public constructor(host: T) {
    this.host = host;
    this.appReady = new BehaviorSubject(false);

    this.host.down
      .filter(Msg.App.AppMessage.is)
      .map((message: any) => {
        if (Msg.App.ModulesUnpackReady.is(message)) {
          return true;
        }
        return false;
      })
      .subscribe(this.appReady);

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
    const YARN = Path.join(this.host.basePath, "node", "node_modules", ".bin", "yarn");
    const NPM = Path.join(this.host.basePath, "node", "node_modules", ".bin", "npm");

    return Fs.existsSync(Path.join(this.host.path, "yarn.lock")) ? YARN : NPM;
  }

  private install() {
    const PATH = Path.join(this.host.basePath, "node", "node_modules", ".bin");
    const NODE = Path.join(PATH, "node");
    const NPM = Path.join(PATH, "npm");
    const INSTALLER = this.installer();

    const id = uuid.v4();
    const message = new Msg.Modules.ModulesInstallStartNotification(id);
    this.host.up.next(message);

    if (!this.appReady.getValue()) {
      this.host.up.next(new Msg.App.ModulesTaskDeferred(id, message));
      this.appReady
        .skipWhile((val) => !val)
        .subscribe(() => this.install());
      return;
    }

    const runArgs: string[] = [
      INSTALLER,
      ...(INSTALLER === NPM ? ["install"] : []),
      "--verbose",
      ...(INSTALLER === NPM ? ["--scripts-prepend-node-path", "auto"] : [])
    ].filter(Boolean);

    const cp = execa(NODE, runArgs, {
      cwd: this.host.path,
      env: {
        PATH: [PATH, process.env.PATH].join(":")
      }
    });

    cp.stderr && cp.stderr.on("data", (data: Buffer) => {
      console.log(String(data));
    });

    cp.stdout && cp.stdout.on("data", (data: Buffer) => {
      console.log(String(data));
    });

    cp
      .then(() => {
        this.host.up.next(new Msg.Modules.ModulesInstallEndNotification(id));
      })
      .catch((err: Error) => {
        console.error(err);
        return this.host.up.next(new Msg.Modules.ModulesInstallErrorNotification(id));
      });
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
    const message = new Msg.Modules.ModulesBuildStartNotification(id);
    this.host.up.next(message);

    if (!this.appReady.getValue()) {
      this.host.up.next(new Msg.App.ModulesTaskDeferred(id, message));
      this.appReady
        .skipWhile((val) => !val)
        .subscribe(() => this.build());
      return;
    }

    const pkg = readPkg.sync(this.host.path);
    const scripts = pkg.scripts || {};
    const PATH = Path.join(this.host.basePath, "node", "node_modules", ".bin");
    const NODE = Path.join(PATH, "node");
    const NPM = Path.join(PATH, "npm");
    const INSTALLER = this.installer();

    if (!scripts.hasOwnProperty("patternplate:build") && !scripts.hasOwnProperty("build")) {
      this.host.up.next(new Msg.Modules.ModulesBuildEndNotification(id));
      return;
    }

    const runScript = scripts.hasOwnProperty("patternplate:build")
      ? "patternplate:build"
      : "build";

    const runArgs: string[] = [
      INSTALLER,
      "run",
      runScript,
      ...(INSTALLER === NPM ? ["--scripts-prepend-node-path", "auto"] : [])
    ].filter(Boolean);

    const cp = execa(NODE, runArgs, {
      cwd: this.host.path,
      env: {
        PATH: [PATH, process.env.PATH].join(":")
      }
    });

    cp.stderr.on("data", (data: Buffer) => {
      console.log(String(data));
    });

    cp.stdout.on("data", (data: Buffer) => {
      console.log(String(data));
    });

    cp.then(() => {
        this.host.up.next(new Msg.Modules.ModulesBuildEndNotification(id));
      })
      .catch((err: Error) => {
        this.host.up.next(new Msg.Modules.ModulesBuildErrorNotification(id));
      });
  }

  private start(request: Msg.Modules.ModulesStartRequest) {
    const id = uuid.v4();
    const PATH = Path.join(this.host.basePath, "node", "node_modules", ".bin");
    const NODE = Path.join(PATH, "node");
    const PATTERNPLATE = Path.join(PATH, "patternplate");
    const NPM = Path.join(PATH, "npm");
    const INSTALLER = this.installer();

    const message = new Msg.Modules.ModulesStartStartNotification(id);
    this.host.up.next(message);

    if (!this.appReady.getValue()) {
      this.host.up.next(new Msg.App.ModulesTaskDeferred(id, message));
      this.appReady
        .skipWhile((val) => !val)
        .subscribe(() => {
          this.start(request);
        });
      return;
    }

    const pkg = readPkg.sync(this.host.path);
    const scripts = pkg.scripts || {};

    this.stopped = false;

    if (scripts.hasOwnProperty("patternplate:watch") || scripts.hasOwnProperty("watch")) {
      const runScript = scripts.hasOwnProperty("patternplate:watch")
        ? "patternplate:watch"
        : "watch";

      const runArgs: string[] = [
        this.installer(),
        "run",
        runScript,
        ...(INSTALLER === NPM ? ["--scripts-prepend-node-path", "auto"] : [])
      ].filter(Boolean);

      this.watch = execa(NODE, runArgs, {
        cwd: this.host.path,
        env: {
          PATH: [PATH, process.env.PATH].join(":")
        }
      });

      this.watch && this.watch.stdout.on("data", (data: any) => {
        console.log(String(data));
      });

      this.watch && this.watch.stderr.on("data", (data: any) => {
        console.log(String(data));
      });

      this.watch && this.watch
        .catch((err) => {
          if (!this.stopped) {
            console.error(`patternplate:watch failed: `, err);
            this.host.up.next(new Msg.Modules.ModulesStartErrorNotification(id));
          }
        });
    }

    getPort()
      .then((port: number) => {
        this.host.up.next(new Msg.Modules.ModulesStartPortNotification(id, port));

        this.cp = fork(PATTERNPLATE, [
          "start",
          "--port", `${port}`,
          "--cwd", `${this.host.path}`
        ], {
          cwd: this.host.path,
          env: {
            NODE_DEBUG: "patternplate",
            PATH: [PATH, process.env.PATH].join(":")
          }
        });

        this.interval = setInterval(() => {
          if (this.cp && typeof this.cp.send === "function" && this.cp.connected) {
            this.cp.send(JSON.stringify({type: "heartbeat"}));
          }
        }, 500);

        this.cp && this.cp.on("message", (envelope: any) => {
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

        this.cp && this.cp.stdout.on("data", (data: any) => {
          console.log(String(data));
        });

        this.cp && this.cp.stderr.on("data", (data: any) => {
          console.log(String(data));
          stderr.push(String(data));
        });

        this.cp && this.cp
          .catch((err) => {
            if (!this.stopped) {
              console.error(`patternplate start failed: `, err);
              this.host.up.next(new Msg.Modules.ModulesStartErrorNotification(id));
            }
          });
      })
      .catch((err: Error) => {
        console.error(err);
      });
  }

  private stop() {
    this.stopped = true;

    if (this.interval) {
      clearTimeout(this.interval);
    }

    const id = uuid.v4();
    this.host.up.next(new Msg.Modules.ModulesStopNotification(id))

    if (this.cp) {
      this.cp.kill();
    }

    if (this.watch) {
      this.watch.kill();
    }

    this.host.up.next(new Msg.Modules.ModulesStopEndNotification(id))
  }

  public getBuild(buildPath: string): Promise<string> {
    const PATTERNPLATE = Path.join(this.host.basePath, "node", "node_modules", ".bin", "patternplate");

    const cp = ChildProcess.fork(PATTERNPLATE, ["build", "--base", "/", "--out", buildPath, "--cwd", this.host.path], {
      stdio: ["pipe", "inherit", "inherit", "ipc"],
      cwd: this.host.path
    });

    return new Promise((resolve, reject) => {
      const onEnd = (code: number) => {
        if (code === 0) {
          resolve(buildPath);
        }
      };

      cp.once("error", reject);
      cp.once("end", onEnd);
      cp.once("close", onEnd);
    });
  }
}
