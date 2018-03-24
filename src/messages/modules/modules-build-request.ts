import {Project} from "../../models/project";
import {Message} from "../message";

export class ModulesBuildRequest extends Message {
  static is(input: any) {
    return input instanceof ModulesBuildRequest;
  }
};
