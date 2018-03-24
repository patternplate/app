import {Project} from "../../models/project";
import {Message} from "../message";

export class ModulesInstallEndNotification extends Message {
  public readonly project: Project;

  static is(input: any) {
    return input instanceof ModulesInstallEndNotification;
  }
};
