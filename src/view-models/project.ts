// import {VCSProgressNotification, VCSCloneStartNotification, VCSCloneEndNotification, VCSErrorNotification, VCSRemoveRequest, VCSRemoveResponse} from "../messages/vcs";
import * as Msg from "../messages"
import {Project} from "../models/project";
import {action, observable} from "mobx";

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
  Ready = "READY",
}

export class ProjectViewModel {
  public readonly model: Project;

  @observable error: Error;
  @observable state: string = ProjectViewState.Unknown;
  @observable progress: number;
  @observable highlighted: boolean;
  @observable port: number = 0;

  constructor(project: Project) {
    this.model = project;

    this.model.up.subscribe((message: any) => {
      const match = Msg.match(message);

      match(Msg.VCS.VCSCloneStartNotification, () => {
        this.setState(ProjectViewState.Fetching);
      });

      match(Msg.VCS.VCSCloneEndNotification, () => {
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

  @action setError(err: Error) {
    this.error = err;
  }

  @action setState(state: string) {
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
}
