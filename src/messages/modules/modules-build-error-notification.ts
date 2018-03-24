import {Project} from "../../models/project";
import {Message} from "../message";

export class ModulesBuildErrorNotification extends Message {
  public readonly project: Project;

  static is(input: any) {
    return input instanceof ModulesBuildErrorNotification;
  }
};
