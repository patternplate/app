import * as Messages from ".";
import {Message} from "../message";

export class ModulesMessage extends Message {
  static is(input: any) {
    return Messages.ModulesInstallRequest.is(input) ||
      Messages.ModulesInstallStartNotification.is(input) ||
      Messages.ModulesInstallEndNotification.is(input) ||
      Messages.ModulesInstallErrorNotification.is(input) ||
      Messages.ModulesBuildRequest.is(input) ||
      Messages.ModulesBuildStartNotification.is(input) ||
      Messages.ModulesBuildEndNotification.is(input) ||
      Messages.ModulesBuildErrorNotification.is(input) ||
      Messages.ModulesStartRequest.is(input) ||
      Messages.ModulesStartStartNotification.is(input) ||
      Messages.ModulesStartStartedNotification.is(input) ||
      Messages.ModulesStartErrorNotification.is(input) ||
      Messages.ModulesStopRequest.is(input) ||
      Messages.ModulesStopNotification.is(input) ||
      Messages.ModulesStopEndNotification.is(input);
  }
};
