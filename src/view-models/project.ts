import {action, observable, computed} from "mobx";
import * as uuid from "uuid";
import * as Msg from "../messages"
import {Project} from "../models/project";

export enum ProjectViewState {
  Unknown = "UNKNOW",
  Fetching = "FETCHING",
  Fetched = "FETCHED",
  Building = "BUILDING",
  Built = "BUILT",
  Installing = "INSTALLING",
  Installed = "INSTALLED",
  Starting = "STARTING",
  Started = "STARTED",
  Stopping = "STOPPING",
  Stopped = "STOPPED",
  Errored = "ERRORED",
  Removing = "REMOVING",
  Removed = "REMOVED",
}

const STATE_ORDER = [
  ProjectViewState.Unknown,
  ProjectViewState.Fetching,
  ProjectViewState.Fetched,
  ProjectViewState.Building,
  ProjectViewState.Built,
  ProjectViewState.Installing,
  ProjectViewState.Installed,
  ProjectViewState.Starting,
  ProjectViewState.Started,
  ProjectViewState.Stopped
];

const TRANSITION_STATES = [
  ProjectViewState.Fetching,
  ProjectViewState.Building,
  ProjectViewState.Installing,
  ProjectViewState.Stopping,
  ProjectViewState.Removing
];

const BUILT = STATE_ORDER.indexOf(ProjectViewState.Built);

export class ProjectViewModel {
  private readonly model: Project;

  @observable error: Error;
  @observable state: ProjectViewState = ProjectViewState.Unknown;
  @observable progress: number;
  @observable highlighted: boolean;
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

  @computed get up() {
    return this.model.up;
  }

  @computed get down() {
    return this.model.down;
  }

  constructor(project: Project) {
    this.model = project;

    this.model.up.subscribe((message: any) => {
      const match = Msg.match(message);

      match(Msg.Project.ProjectAnalyseResponse, () => {
        if (message.synced) {
          this.setState(ProjectViewState.Fetched);
        }
        if (message.installed) {
          this.setState(ProjectViewState.Installed);

          const PREV_STATE = STATE_ORDER.indexOf(this.model.previous.state);

          console.log(message);
          // If no diff happened and the persisted model had been build
          // assume the current state has a build, too
          if (message.diff.length === 0 && PREV_STATE >= BUILT) {
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

  @action highlight() {
    this.highlighted = true;
  }

  @action open() {
    throw new Error("Not implemented yet");
  }

  @action edit() {
    throw new Error("Not implemented yet");
  }

  @action remove() {
    const tid = uuid.v4();
    this.down.next(new Msg.VCS.VCSRemoveRequest(tid));
  }
}
