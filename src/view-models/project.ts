// import {VCSProgressNotification, VCSCloneStartNotification, VCSCloneEndNotification, VCSErrorNotification, VCSRemoveRequest, VCSRemoveResponse} from "../messages/vcs";
import * as Msg from "../messages"
import {Project} from "../models/project";
import {action, observable} from "mobx";

export enum ProjectViewState {
  Unknown = "UNKNOW",
  Fetching = "FETCHING",
  Fetched = "FETCHED",
  Installing = "INSTALLING",
  Installed = "INSTALLED",
  Errored = "ERRORED",
  Removing = "REMOVING",
  Removed = "REMOVED",
  Ready = "READY",
  Running = "RUNNING"
}

export class ProjectViewModel {
  public readonly model: Project;

  @observable error: Error;
  @observable state: string = ProjectViewState.Unknown;
  @observable progress: number;
  @observable highlighted: boolean;

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

  @action highlight() {
    this.highlighted = true;
  }
}
