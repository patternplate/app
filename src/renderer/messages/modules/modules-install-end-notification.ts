import {Message} from "../message";

export class ModulesInstallEndNotification extends Message {
  static is(input: any) {
    return input instanceof ModulesInstallEndNotification;
  }
};
