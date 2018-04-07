import {action, observable} from "mobx";

export enum AppModulesState {
  Started = "STARTED",
  Error = "ERROR",
  Ready = "READY",
}

export class AppViewModel {
  @observable modulesState: AppModulesState = AppModulesState.Started;

  @action setModulesState(state: AppModulesState) {
    this.modulesState = state;
  }
}
