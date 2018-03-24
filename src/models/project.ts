import * as Os from "os";
import * as Path from "path";
import * as Crypto from "crypto";
import { Subject } from "rxjs";
import * as uuid from "uuid";
import * as execa from "execa";
import {remote} from "electron";

import * as Msg from "../messages";
import { Git, VersionControl } from "./git";
import { Modules } from "./modules";
import { Channel } from "./nextable";

const gitUrlParse = require("git-url-parse");

export interface ProjectInit {
  id?: string;
  path: string;
  url: string;
}

export class Project implements Channel {
  private messages: (Msg.VCS.VCSMessage | Msg.Project.ProjectMessage)[] = [];

  public readonly id: string;
  public readonly url: string;
  public readonly path: string;
  public readonly vcs: VersionControl;
  public readonly modules: Modules<Project>;

  public readonly up: Subject<any> = new Subject();
  public readonly down: Subject<any> = new Subject();

  static from(init: ProjectInit) {
    return new Project(init);
  }

  constructor(init: ProjectInit) {
    const parsed = gitUrlParse(init.url);

    this.id = init.id || uuid.v4();
    this.url = init.url;
    this.path = Path.join(init.path, parsed.owner, parsed.pathname);
    this.vcs = new Git(this);
    this.modules = new Modules(this);

    this.down.subscribe((message: any) => {
      const match = Msg.match(message);
      match(Msg.Project.ProjectProcessRequest, () => this.process());
      match(Msg.Project.ProjectInstallRequest, () => this.install());
      match(Msg.Project.ProjectBuildRequest, () => this.build());
      match(Msg.Project.ProjectStartRequest, () => this.start());
    });

    this.up.subscribe((message: any) => {
      const match = Msg.match(message);
      match(Msg.VCS.VCSCloneEndNotification, () => {
        setTimeout(() => this.down.next(new Msg.Project.ProjectInstallRequest(this.id, this)), 0);
      });
      match(Msg.Modules.ModulesInstallEndNotification, () => {
        setTimeout(() => this.down.next(new Msg.Project.ProjectBuildRequest(this.id, this)), 0);
      });
      match(Msg.Modules.ModulesBuildEndNotification, () => {
        setTimeout(() => this.down.next(new Msg.Project.ProjectStartRequest(this.id, this)), 0);
      });
    });
  }

  process() {
    this.down.next(new Msg.VCS.VCSCloneRequest(this.id, {
      url: this.url,
      path: this.path
    }));
  }

  install() {
    this.down.next(new Msg.Modules.ModulesInstallRequest(this.id));
  }

  build() {
    this.down.next(new Msg.Modules.ModulesBuildRequest(this.id));
  }

  start() {
    this.down.next(new Msg.Modules.ModulesStartRequest(this.id));
  }

  stop() {
    this.down.next(new Msg.Modules.ModulesStopRequest(this.id));
  }

  open() {
    this.up.next(new Msg.Project.ProjectOpenNotification(this.id, this.id));
  }

  close() {
    this.up.next(new Msg.Project.ProjectCloseNotification(this.id, this.id));
  }

  remove() {
    this.down.next(new Msg.VCS.VCSRemoveRequest(this.id));
  }
}
