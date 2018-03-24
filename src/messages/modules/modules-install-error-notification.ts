import {Project} from "../../models/project";
import {Message} from "../message";

export class ModulesInstallErrorNotification extends Message {
  static is(input: any) {
    return input instanceof ModulesInstallErrorNotification;
  }
};
