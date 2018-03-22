import {VCSProgressMessage, VCSCloneStartMessage, VCSCloneEndMessage, VCSErrorMessage, VCSRemoveRequest, VCSRemoveResponse} from "../messages/vcs";
import {Project} from "../models/project";
import {action, observable} from "mobx";

export enum ProjectViewState {
  Unknown = "UNKNOW",
  Fetching = "FETCHING",
  Fetched = "FETCHED",
  Errored = "ERRORED",
  Removing = "REMOVING",
  Removed = "REMOVED",
  Ready = "READY"
}

export class ProjectViewModel {
  public readonly model: Project;

  @observable error: Error;
  @observable state: string = ProjectViewState.Unknown;
  @observable progress: number;
  @observable highlighted: boolean;

  constructor(project: Project) {
    this.model = project;

    this.model.subscribe((message: any) => {
      if (message instanceof VCSCloneStartMessage) {
        this.setState(ProjectViewState.Fetching);
      }

      if (message instanceof VCSCloneEndMessage) {
        this.setState(ProjectViewState.Fetched);
      }

      if (message instanceof VCSErrorMessage) {
        this.setState(ProjectViewState.Errored);
      }

      if (message instanceof VCSRemoveRequest) {
        this.setState(ProjectViewState.Removing);
      }

      if (message instanceof VCSRemoveResponse) {
        this.setState(ProjectViewState.Removed);
      }
    });

    this.model.subscribe((message: any) => {
      if (message instanceof VCSCloneStartMessage) {
        this.setProgress(0);
      }

      if (message instanceof VCSCloneEndMessage) {
        this.setProgress(1);
      }

      if (message instanceof VCSErrorMessage) {
        this.setProgress(0);
      }

      if (message instanceof VCSProgressMessage) {
        const {transferProgress} = message;
        this.setProgress(transferProgress.receivedObjects() / transferProgress.totalObjects());
      }
    });

    this.model.subscribe((message: any) => {
      if (message instanceof VCSErrorMessage) {
        this.setError(message.error);
      }
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
