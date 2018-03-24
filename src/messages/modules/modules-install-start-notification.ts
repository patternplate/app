import {Project} from "../../models/project";
import {Message} from "../message";

export class ModulesInstallStartNotification extends Message {
  public readonly project: Project;

  static is(input: any) {
    return input instanceof ModulesInstallStartNotification;
  }
};
