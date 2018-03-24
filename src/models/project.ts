import * as Os from "os";
import * as Path from "path";
import * as Crypto from "crypto";
import { Subject } from "rxjs";
import * as uuid from "uuid";
import * as execa from "execa";

import * as Msg from "../messages";
import { Git, VersionControl } from "./git";
import { Channel } from "./nextable";

export enum ProjectState {
  Unprocessed = "UNPROCESSED",
  Processing = "PROCESSING",
  Fetching = "FETCHING",
  Fetched = "FETCHED",
  NeedsInstall = "NEEDS_INSTALL",
  Installed = "INSTALLED",
  Error = "ERROR",
  Undefined = "UNDEFINED"
}

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

  public readonly up: Subject<any> = new Subject();
  public readonly down: Subject<any> = new Subject();

  static from(init: ProjectInit) {
    return new Project(init);
  }

  constructor(init: ProjectInit) {
    this.id = init.id || uuid.v4();
    this.url = init.url;
    this.path = init.path;
    this.vcs = new Git(this);

    this.down.subscribe((message: any) => {
      const match = Msg.match(message);

      match(Msg.Project.ProjectProcessRequest, () => {
        this.process();
      });

      match(Msg.VCS.VCSCloneEndNotification, () =>
        this.down.next(new Msg.Project.ProjectInstallRequest(this.id, this))
      );

      match(Msg.Project.ProjectInstallRequest, () => this.install());
    });
  }

  process() {
    this.down.next(new Msg.VCS.VCSCloneRequest(this.id, {
      url: this.url,
      path: this.path
    }));
    return this;
  }

  install() {
//    const cp = execa("npm", ["install"], {cwd: this.repository.path});
  }

  remove() {
    this.down.next(new Msg.VCS.VCSRemoveRequest(this.id));
    return this;
  }
}
