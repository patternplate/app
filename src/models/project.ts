import * as Path from "path";
import { Subject } from "rxjs";
import * as uuid from "uuid";

import * as Msg from "../messages";
import { Git, VersionControl } from "./git";
import { Modules } from "./modules";
import { Channel } from "./nextable";

declare var __static: string;

const execa = require("execa");
const gitUrlParse = require("git-url-parse");
const sander = require("@marionebl/sander");

const SCREENSHOT = Path.join(__static, "screenshot.js");

export interface ProjectInit {
  autoStart?: boolean;
  id?: string;
  name: string;
  basePath: string;
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
  basePath: string;
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
  public readonly basePath: string;

  public readonly up: Subject<any> = new Subject();
  public readonly down: Subject<any> = new Subject();

  static createEmpty(opts: ProjectOptions): Project {
    return new Project({
      url: "",
      basePath: opts.basePath,
      path: Path.join(opts.basePath, uuid.v4()),
      name: "",
      previous: null,
      autoStart: true
    });
  }

  static from(init: ProjectInit): Project {
    return new Project(init);
  }

  static fromInput(input: ProjectInput, opts: ProjectOptions): Project {
    const parsed = gitUrlParse(input.url);

    return new Project({
      name: input.name,
      url: input.url,
      basePath: opts.basePath,
      path: Path.join(opts.basePath, parsed.full_name.split("/").join(Path.sep)),
      previous: null,
      autoStart: opts.autoStart
    });
  }

  static fromUrl(url: string, options: ProjectOptions): Project {
    const parsed = gitUrlParse(url);
    return new Project({
      url,
      basePath: options.basePath,
      path: Path.join(options.basePath, parsed.full_name.split("/").join(Path.sep)),
      name: parsed.full_name,
      previous: null,
      autoStart: options.autoStart
    });
  }

  static fromPath(path: string, options: ProjectOptions): Project {
    return new Project({
      url: "",
      path,
      basePath: options.basePath,
      name: "",
      previous: null,
      autoStart: options.autoStart
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
    this.basePath = init.basePath;

    if (typeof init.autoStart === "boolean") {
      this.autoStart = init.autoStart;
    }

    this.down.subscribe((message: any) => {
      const match = Msg.match(message);
      match(Msg.Project.ProjectProcessRequest, () => this.clone());
      match(Msg.Project.ProjectInstallRequest, () => this.install());
      match(Msg.Project.ProjectConfigureRequest, () => this.configure());
      match(Msg.Project.ProjectBuildRequest, () => this.build());
      match(Msg.Project.ProjectStartRequest, () => this.start());
      match(Msg.Project.ProjectAnalyseRequest, () => this.analyse());
      match(Msg.Project.ProjectScreenshotRequest, () => this.screenshot())
    });

    this.up.subscribe((message: any) => {
      const match = Msg.match(message);

      // TODO: Aggregate ModuleAnalyseResponse here
      match(Msg.VCS.VCSAnalyseResponse, (resp: any) => {
        this.up.next(new Msg.Project.ProjectAnalyseResponse(message.tid, {
          synced: resp.synced,
          installed: resp.synced,
          diff: resp.diff
        }));

        this.screenshot();
      });

      match(Msg.VCS.VCSReadResponse, (resp: any) => {
        this.setName(resp.name);
        this.setUrl(resp.url);

        this.up.next(new Msg.Project.ProjectReadResponse(message.tid, {
          name: resp.name,
          url: resp.url
        }));

        this.screenshot();
      });

      match(Msg.Modules.ModulesConfigureResponse, (resp: any) => {
        const config = resp.payload.config;

        if (!config) {
          return;
        }

        this.setConfig(config);
      });

      match(Msg.VCS.VCSFetchEndNotification, () => {
        if (message.diff.length > 0) {
          console.log("!");
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

      match(Msg.Modules.ModulesStartStartedNotification, () => {
        if (message.open) {
          this.up.next(new Msg.Project.ProjectOpenRequest(message.tid, this.id));
        }
      });
    });
  }

  clone() {
    this.down.next(new Msg.VCS.VCSCloneRequest(this.id, {
      url: this.url,
      path: this.path
    }));
  }

  sync() {
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
    this.down.next(new Msg.VCS.VCSRemoveRequest(this.id));
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

  async screenshot() {
    const screenshotPath = Path.join(this.basePath, `screenshots`, `${this.id}.png`);
    const buildPath = Path.join(this.basePath, `builds`, this.id);

    const image = Path.basename(screenshotPath);
    const payload = {image, project: this.id};

    if (await sander.exists(screenshotPath)) {
      return this.up.next(new Msg.Project.ProjectScreenshotNotification(this.id, payload));
    }

    if (await sander.exists(buildPath)) {
      await execa(SCREENSHOT, [buildPath, screenshotPath]);
      return this.up.next(new Msg.Project.ProjectScreenshotNotification(this.id, payload));
    }

    await this.modules.getBuild(buildPath);
    await execa(SCREENSHOT, [buildPath, screenshotPath]);
    this.up.next(new Msg.Project.ProjectScreenshotNotification(this.id, payload));
  }
}
