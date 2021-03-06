import {action, observable} from "mobx";

export enum AppModulesState {
  Started = "STARTED",
  Error = "ERROR",
  Ready = "READY",
}

export enum AppUpdatesState {
  Unknown = "UNKNOWN",
  Checking = "CHECKING",
  Available = "AVAILABLE",
  Unavailable = "UNAVAILABLE",
  Downloading = "DOWNLOADING",
  Downloaded = "DOWNLOADED"
}

export class AppViewModel {
  @observable modulesState: AppModulesState = AppModulesState.Started;
  @observable updateState: AppUpdatesState = AppUpdatesState.Unknown;


  @action setUpdateState(state: AppUpdatesState) {
    this.updateState = state;
  }

  @action setModulesState(state: AppModulesState) {
    this.modulesState = state;
  }
}
