import * as Fs from "fs";
import * as Path from "path";
import * as execa from "execa";
import * as uuid from "uuid";

import {Channel} from "./nextable";
import * as Msg from "../messages";

const resolveBin = require("resolve-bin");

const YARN = Path.join(__dirname, "..", "..", "node_modules", ".bin", "yarn");
const NPM = Path.join(__dirname, "..", "..", "node_modules", ".bin", "npm");

export interface Installable extends Channel {
  id: string;
  path: string;
}

export class Modules<T extends Installable> {
  public readonly host: T;
  public readonly installer: string;

  public constructor(host: T) {
    this.host = host;

    this.installer = Fs.existsSync(Path.join(host.path, "yarn.lock")) ? YARN : NPM;

    this.host.down.subscribe((message: any) => {
      const match = Msg.match(message);
      match(Msg.Modules.ModulesInstallRequest, (req) => this.install());
    });
  }

  public install() {
    const id = uuid.v4();
    this.host.up.next(new Msg.Modules.ModulesInstallStartNotification(id));

    const cp = execa(this.installer, ["install", "--verbose"], {cwd: this.host.path});

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
}
