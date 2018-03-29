import {Message} from "../message";

export class ModulesBuildStartNotification extends Message {
  static is(input: any) {
    return input instanceof ModulesBuildStartNotification;
  }
};
