import {Message} from "../message";

export class ModulesInstallStartNotification extends Message {
  static is(input: any) {
    return input instanceof ModulesInstallStartNotification;
  }
};
