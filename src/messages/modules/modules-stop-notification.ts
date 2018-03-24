import {Message} from "../message";

export class ModulesStopNotification extends Message {
  static is(input: any) {
    return input instanceof ModulesStopNotification;
  }
};
