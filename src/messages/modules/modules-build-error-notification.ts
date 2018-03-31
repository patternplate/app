import {Message} from "../message";

export class ModulesBuildErrorNotification extends Message {
  static is(input: any) {
    return input instanceof ModulesBuildErrorNotification;
  }
};
