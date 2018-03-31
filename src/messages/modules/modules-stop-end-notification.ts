import {Message} from "../message";

export class ModulesStopEndNotification extends Message {
  static is(input: any) {
    return input instanceof ModulesStopEndNotification;
  }
};
