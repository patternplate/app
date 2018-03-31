import {Message} from "../message";

export class ModulesBuildEndNotification extends Message {
  static is(input: any) {
    return input instanceof ModulesBuildEndNotification;
  }
};

