import {Message} from "../message";

export class ModulesStartErrorNotification extends Message {
  static is(input: any) {
    return input instanceof ModulesStartErrorNotification;
  }
};
