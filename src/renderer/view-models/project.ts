import {action, observable, computed} from "mobx";
import * as uuid from "uuid";
import * as Msg from "../../messages"
import {Project} from "../../models/project";

const parseGitUrl = require("git-url-parse");

export enum ProjectViewState {
  Unknown = "UNKNOW",
  Fetching = "FETCHING",
  Fetched = "FETCHED",
  Installing = "INSTALLING",
  Installed = "INSTALLED",
  Building = "BUILDING",
  Built = "BUILT",
  Starting = "STARTING",
  Started = "STARTED",
  Opening = "OPENING",
  Opened = "OPENED",
  Stopping = "STOPPING",
  Stopped = "STOPPED",
  Errored = "ERRORED",
  Removing = "REMOVING",
  Removed = "REMOVED",
}

export interface ProjectOptions {
  editable: boolean;
}

const STATE_ORDER = [
  ProjectViewState.Unknown,
  ProjectViewState.Fetching,
  ProjectViewState.Fetched,
  ProjectViewState.Installing,
  ProjectViewState.Installed,
  ProjectViewState.Building,
  ProjectViewState.Built,
  ProjectViewState.Starting,
  ProjectViewState.Started,
  ProjectViewState.Opening,
  ProjectViewState.Opened,
  ProjectViewState.Stopped,
];

const WORKING_STATES = [
  ProjectViewState.Fetching,
  ProjectViewState.Building,
  ProjectViewState.Installing,
  ProjectViewState.Removing,
  ProjectViewState.Starting,
  ProjectViewState.Opening
];

const TRANSITION_STATES = [
  ProjectViewState.Stopping,
  ProjectViewState.Removing,
];

export class ProjectViewModel {
  private model: Project;
  private highlightTimer: NodeJS.Timer | null = null;

  @observable inputName: string = "";
  @observable inputUrl: string = "";
  @observable error: Error | null = null;
  @observable state: ProjectViewState = ProjectViewState.Unknown;
  @observable logo: string = "";
  @observable progress: number = 0;
  @observable highlighted: boolean = false;
  @observable port: number = 0;
  @observable editable: boolean = false;

  @computed get id() {
    return this.model.id;
  }

  @computed get name() {
    return this.model.name;
  }

  @computed get url() {
    return this.model.url;
  }

  @computed get path() {
    return this.model.path;
  }

  @computed get managed() {
    return this.model.managed;
  }

  @computed get up() {
    return this.model.up;
  }

  @computed get down() {
    return this.model.down;
  }

  static createEmpty(): ProjectViewModel {
    const model = Project.createEmpty();
    return new ProjectViewModel(model, {editable: true});
  }

  constructor(project: Project, options?: ProjectOptions) {
    this.model = project;

    if (options && options.hasOwnProperty("editable")) {
      this.editable = options.editable;
    }

    this.model.up.subscribe((message: any) => {
      const match = Msg.match(message);

      match(Msg.Project.ProjectAnalyseResponse, () => {
        if (!this.model.managed) {
          this.setState(ProjectViewState.Built);
          return;
        }

        if (message.synced) {
          this.setState(ProjectViewState.Fetched);
        }
        if (message.installed) {
          this.setState(ProjectViewState.Installed);

          this.model.down.next(new Msg.Modules.ModulesConfigureRequest(this.id));

          // If no diff happened assume the current state has a build, too
          if (message.diff.length === 0) {
            this.setState(ProjectViewState.Built);
          }
        }
      })

      match(Msg.VCS.VCSCloneStartNotification, () => {
        this.setState(ProjectViewState.Fetching);
      });

      match(Msg.VCS.VCSCloneEndNotification, () => {
        this.setState(ProjectViewState.Fetched);
      });

      match(Msg.VCS.VCSFetchStartNotification, () => {
        this.setState(ProjectViewState.Fetching);
      });

      match(Msg.VCS.VCSFetchEndNotification, () => {
        this.setState(ProjectViewState.Fetched);
      });

      match(Msg.VCS.VCSErrorNotification, () => {
        this.setState(ProjectViewState.Errored);
      });

      match(Msg.VCS.VCSRemoveStartNotification, () => {
        this.setState(ProjectViewState.Removing);
      });

      match(Msg.VCS.VCSRemoveEndNotification, () => {
        this.setState(ProjectViewState.Removed);
      });

      match(Msg.Modules.ModulesInstallStartNotification, () => {
        this.setState(ProjectViewState.Installing);
      });

      match(Msg.Modules.ModulesInstallEndNotification, () => {
        this.setState(ProjectViewState.Installed);
      });

      match(Msg.Modules.ModulesInstallErrorNotification, () => {
        this.setState(ProjectViewState.Errored);
      });

      match(Msg.Modules.ModulesConfigureResponse, () => {
        this.setLogo(this.model.config.logo);
      })

      match(Msg.Modules.ModulesBuildStartNotification, () => {
        this.setState(ProjectViewState.Building);
      });

      match(Msg.Modules.ModulesBuildEndNotification, () => {
        this.setState(ProjectViewState.Built);
      });

      match(Msg.Modules.ModulesBuildErrorNotification, () => {
        this.setState(ProjectViewState.Errored);
      });

      match(Msg.Modules.ModulesStartStartNotification, () => {
        this.setState(ProjectViewState.Starting);
      });

      match(Msg.Modules.ModulesStartStartedNotification, (notification) => {
        this.setPort((notification as any).patternplate.port);
        this.setState(ProjectViewState.Started);
      });

      match(Msg.Modules.ModulesStartErrorNotification, () => {
        this.setState(ProjectViewState.Errored);
      });

      match(Msg.Modules.ModulesStopNotification, () => {
        this.setState(ProjectViewState.Stopping);
      });

      match(Msg.Modules.ModulesStopEndNotification, (notification) => {
        this.setState(ProjectViewState.Stopped);
      });

      match(Msg.Project.ProjectOpenNotification, () => {
        this.setState(ProjectViewState.Opening);
      });

      match(Msg.Project.ProjectOpenedNotification, () => {
        this.setState(ProjectViewState.Opened);
      })
    });

    this.model.up.subscribe((message: any) => {
      const match = Msg.match(message);

      match(Msg.VCS.VCSCloneStartNotification, () => this.setProgress(0));
      match(Msg.VCS.VCSCloneEndNotification, () => this.setProgress(1));
      match(Msg.VCS.VCSErrorNotification, () => this.setProgress(0));

      match(Msg.VCS.VCSProgressNotification, message => {
        const {transferProgress} = (message as any);
        this.setProgress(transferProgress.receivedObjects() / transferProgress.totalObjects());
      });
    });
  }

  isWorking(): boolean {
    return WORKING_STATES.indexOf(this.state) > -1;
  }

  isReady(): boolean {
    return this.gte(ProjectViewState.Built);
  }

  isStarted(): boolean {
    return this.gte(ProjectViewState.Started) && this.lt(ProjectViewState.Stopped);
  }

  isOpened(): boolean {
    return this.state === ProjectViewState.Opened;
  }

  inTransition(): boolean {
    return TRANSITION_STATES.indexOf(this.state) > -1;
  }

  lt(cmp: ProjectViewState): boolean {
    return STATE_ORDER.indexOf(this.state) < STATE_ORDER.indexOf(cmp);
  }

  lte(cmp: ProjectViewState): boolean {
    return STATE_ORDER.indexOf(this.state) <= STATE_ORDER.indexOf(cmp);
  }

  gt(cmp: ProjectViewState): boolean {
    return STATE_ORDER.indexOf(this.state) > STATE_ORDER.indexOf(cmp);
  }

  gte(cmp: ProjectViewState): boolean {
    return STATE_ORDER.indexOf(this.state) >= STATE_ORDER.indexOf(cmp);
  }

  @action setError(err: Error) {
    this.error = err;
  }

  @action setState(state: ProjectViewState) {
    this.state = state;
  }

  @action setProgress(percentage: number) {
    this.progress = percentage;
  }

  @action setPort(port: number) {
    this.port = port;
  }

  @action setHighlighted() {
    this.highlighted = true;

    if (typeof this.highlightTimer === "number") {
      clearTimeout(this.highlightTimer);
    }

    this.highlightTimer = setTimeout(() => {
      this.highlighted = false;
    }, 600);
  }

  @action setInputName(inputName: string) {
    this.inputName = inputName;
  }

  @action setInputUrl(inputUrl: string) {
    this.inputUrl = inputUrl;

    try {
      const parsed = parseGitUrl(inputUrl);
      this.inputName = parsed.full_name;
    } catch (err) {
      this.inputName = "";
    }
  }

  @action setLogo(logo: string) {
    this.logo = logo;
  }

  analyse() {
    this.model.analyse();
  }

  clone() {
    this.model.process();
  }

  start() {
    this.model.start();
  }

  stop() {
    this.model.stop();
  }


  remove() {
    this.model.remove();
  }

  @action save() {
    if (!this.inputUrl) {
      return;
    }

    const model = Project.fromInput({
      name: this.inputName,
      url: this.inputUrl
    });

    const tid = uuid.v4();

    const onModelMessage = (message: any) => {
      const match = Msg.match(message);

      match(Msg.Project.ProjectSaveResponse, () => {
        if (message.tid !== tid) {
          return;
        }

        if (!message.payload.success) {
          return;
        }

        const url = this.inputUrl || this.url;
        const name = this.inputName || this.name;
        const changed = url !== this.model.url;

        this.model.setUrl(url);
        this.model.setName(name);
        this.setEditable(false);

        if (changed) {
          this.model.process();
        }

        this.up.next(new Msg.Project.ProjectSaveNotification(tid, this.model));
      });
    };

    model.up.subscribe(onModelMessage);
    this.up.next(new Msg.Project.ProjectSaveRequest(tid, model));
  }

  @action setEditable(editable: boolean) {
    this.editable = editable;
  }

  @action discard() {
    const tid = uuid.v4();
    this.up.next(new Msg.Project.ProjectDiscardNotification(tid, this.id));
  }
}
