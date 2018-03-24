import {Message} from "../message";

export class ModulesStartStartNotification extends Message {
  static is(input: any) {
    return input instanceof ModulesStartStartNotification;
  }
};
