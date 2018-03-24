import {Message} from "../message";

export class ModulesStartStartedNotification extends Message {
  static is(input: any) {
    return input instanceof ModulesStartStartedNotification;
  }
};
