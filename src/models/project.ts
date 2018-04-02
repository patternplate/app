import * as Os from "os";
import * as Path from "path";
import { Subject } from "rxjs";
import * as uuid from "uuid";

import * as Msg from "../messages";
import { Git, VersionControl } from "./git";
import { Modules } from "./modules";
import { Channel } from "./nextable";

const gitUrlParse = require("git-url-parse");

export interface ProjectInit {
  autoStart?: boolean;
  id?: string;
  name: string;
  path: string;
  url: string;
  previous: { [key: string]: any } | null;
  managed: boolean;
}

export interface ProjectInput {
  name: string;
  url: string;
}

export interface ProjectOptions {
  autoStart: boolean;
}

export class Project implements Channel {
  public url: string;
  public name: string;
  public path: string;
  public config: any;
  public autoStart: boolean = false;
  public readonly id: string;
  public readonly vcs: VersionControl;
  public readonly modules: Modules<Project>;
  public readonly previous: any;
  public readonly managed: boolean;

  public readonly up: Subject<any> = new Subject();
  public readonly down: Subject<any> = new Subject();

  static createEmpty(): Project {
    return new Project({
      url: "",
      path: Path.join(Os.homedir(), "patternplate", uuid.v4()),
      name: "",
      previous: null,
      autoStart: true,
      managed: true
    });
  }

  static from(init: ProjectInit): Project {
    return new Project(init);
  }

  static fromInput(input: ProjectInput): Project {
    const parsed = gitUrlParse(input.url);

    return new Project({
      name: input.name,
      url: input.url,
      path: Path.join(Os.homedir(), "patternplate", parsed.full_name.split("/").join(Path.sep)),
      previous: null,
      autoStart: true,
      managed: true
    });
  }

  static fromUrl(url: string, options?: ProjectOptions): Project {
    const parsed = gitUrlParse(url);

    return new Project({
      url,
      path: Path.join(Os.homedir(), "patternplate", parsed.full_name.split("/").join(Path.sep)),
      name: parsed.full_name,
      previous: null,
      autoStart: options ? options.autoStart : false,
      managed: true
    });
  }

  static fromPath(path: string): Project {
    return new Project({
      url: "",
      path,
      name: "",
      previous: null,
      autoStart: false,
      managed: false
    });
  }

  constructor(init: ProjectInit) {
    this.id = init.id || uuid.v4();
    this.url = init.url;
    this.path = init.path;
    this.vcs = new Git(this);
    this.modules = new Modules(this);
    this.previous = init.previous;
    this.name = init.name;
    this.managed = init.managed;

    if (typeof init.autoStart === "boolean") {
      this.autoStart = init.autoStart;
    }

    this.down.subscribe((message: any) => {
      const match = Msg.match(message);
      match(Msg.Project.ProjectProcessRequest, () => this.process());
      match(Msg.Project.ProjectInstallRequest, () => this.install());
      match(Msg.Project.ProjectConfigureRequest, () => this.configure());
      match(Msg.Project.ProjectBuildRequest, () => this.build());
      match(Msg.Project.ProjectStartRequest, () => this.start());
      match(Msg.Project.ProjectAnalyseRequest, () => this.analyse());
    });

    this.up.subscribe((message: any) => {
      const match = Msg.match(message);

      // TODO: Aggregate ModuleAnalyseResponse here
      match(Msg.VCS.VCSAnalyseResponse, (resp: any) => {
        this.up.next(new Msg.Project.ProjectAnalyseResponse(message.tid, {
          synced: resp.synced,
          installed: resp.synced,
          diff: resp.diff
        }))
      });

      match(Msg.VCS.VCSReadResponse, (resp: any) => {
        this.setName(resp.name);
        this.setUrl(resp.url);

        this.up.next(new Msg.Project.ProjectReadResponse(message.tid, {
          name: resp.name,
          url: resp.url
        }));
      });

      match(Msg.Modules.ModulesConfigureResponse, (resp: any) => {
        const config = resp.payload.config;

        if (!config) {
          return;
        }

        this.setConfig(config);
      });

      match(Msg.Modules.ModulesStartStartedNotification, () => {
        if (message.open) {
          this.up.next(new Msg.Project.ProjectOpenRequest(message.tid, this.id));
        }
      });

      match(Msg.VCS.VCSCloneEndNotification, () => {
        setTimeout(() => this.down.next(new Msg.Project.ProjectInstallRequest(this.id, this)), 0);
      });

      match(Msg.Modules.ModulesInstallEndNotification, () => {
        setTimeout(() => {
          this.down.next(new Msg.Project.ProjectConfigureRequest(this.id));
          this.down.next(new Msg.Project.ProjectBuildRequest(this.id, this));
        }, 0);
      });
    });
  }

  process() {
    this.down.next(new Msg.VCS.VCSCloneRequest(this.id, {
      url: this.url,
      path: this.path
    }));
  }

  fetch() {
    this.down.next(new Msg.VCS.VCSFetchRequest(this.id));
  }

  analyse() {
    this.down.next(new Msg.VCS.VCSAnalyseRequest(this.id));
    this.down.next(new Msg.Modules.ModulesConfigureRequest(this.id));
  }

  read() {
    this.down.next(new Msg.VCS.VCSReadRequest(this.id));
    this.down.next(new Msg.Modules.ModulesConfigureRequest(this.id));
  }

  install() {
    this.down.next(new Msg.Modules.ModulesInstallRequest(this.id));
  }

  configure() {
    this.down.next(new Msg.Modules.ModulesConfigureRequest(this.id));
  }

  build() {
    this.down.next(new Msg.Modules.ModulesBuildRequest(this.id));
  }

  start(opts?: {open: boolean}) {
    this.down.next(new Msg.Modules.ModulesStartRequest(this.id, opts));
  }

  stop() {
    this.down.next(new Msg.Modules.ModulesStopRequest(this.id));
  }

  open() {
    this.up.next(new Msg.Project.ProjectOpenRequest(this.id, this.id));
  }

  close() {
    this.up.next(new Msg.Project.ProjectCloseNotification(this.id, this.id));
  }

  remove() {
    if (this.managed) {
      this.down.next(new Msg.VCS.VCSRemoveRequest(this.id));
    } else {
      this.up.next(new Msg.VCS.VCSRemoveEndNotification(this.id));
      this.up.next(new Msg.VCS.VCSRemoveResponse(this.id, this.id));
    }
  }

  setUrl(url: string) {
    this.url = url;
  }

  setName(name: string) {
    this.name = name;
  }

  setConfig(config: any) {
    this.config = config;
  }
}
