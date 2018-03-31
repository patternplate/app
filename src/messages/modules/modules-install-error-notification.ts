import {Message} from "../message";

export class ModulesInstallErrorNotification extends Message {
  static is(input: any) {
    return input instanceof ModulesInstallErrorNotification;
  }
};
