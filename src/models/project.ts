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

  public readonly up: Subject<any> = new Subject();
  public readonly down: Subject<any> = new Subject();

  static createEmpty(): Project {
    return new Project({
      url: "",
      path: Path.join(Os.homedir(), "patternplate"),
      name: "",
      previous: null,
      autoStart: true
    });
  }

  static from(init: ProjectInit): Project {
    return new Project(init);
  }

  static fromInput(input: ProjectInput): Project {
    return new Project({
      name: input.name,
      url: input.url,
      path: Path.join(Os.homedir(), "patternplate"),
      previous: null,
      autoStart: true
    });
  }

  static fromUrl(url: string, options?: ProjectOptions): Project {
    const parsed = gitUrlParse(url);

    return new Project({
      url,
      path: Path.join(Os.homedir(), "patternplate"),
      name: parsed.full_name,
      previous: null,
      autoStart: options ? options.autoStart : false
    });
  }

  constructor(init: ProjectInit) {
    const parsed = gitUrlParse(init.url);
    this.id = init.id || uuid.v4();
    this.url = init.url;
    this.path = Path.resolve(init.path, parsed.full_name.split("/").join(Path.sep));
    this.vcs = new Git(this);
    this.modules = new Modules(this);
    this.previous = init.previous;
    this.name = init.name;

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

      match(Msg.VCS.VCSAnalyseResponse, (resp: any) => {
        // Reinitialize project if missing from disk
        if (!resp.exists) {
          return this.process();
        }

        if (!resp.synced) {
          this.fetch();
        }

        this.up.next(new Msg.Project.ProjectAnalyseResponse(message.tid, {
          synced: true,
          installed: true,
          diff: resp.diff
        }))
      });

      match(Msg.Modules.ModulesConfigureResponse, (resp: any) => {
        const config = resp.payload.config;

        if (!config) {
          return;
        }

        this.setConfig(config);
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

  setUrl(url: string) {
    const parsed = gitUrlParse(url);
    this.path = Path.resolve(this.path, parsed.full_name.split("/").join(Path.sep));
    this.url = url;
  }

  setName(name: string) {
    this.name = name;
  }

  setConfig(config: any) {
    this.config = config;
  }
}
