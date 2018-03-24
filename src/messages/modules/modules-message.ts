import * as Messages from ".";
import {Message} from "../message";

export class ModulesMessage extends Message {
  static is(input: any) {
    return Messages.ModulesInstallRequest.is(input) ||
      Messages.ModulesInstallStartNotification.is(input) ||
      Messages.ModulesInstallEndNotification.is(input) ||
      Messages.ModulesInstallErrorNotification.is(input);
  }
};
