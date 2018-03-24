import {Project} from "../../models/project";
import {Message} from "../message";

export class ModulesStartRequest extends Message {
  static is(input: any) {
    return input instanceof ModulesStartRequest;
  }
};
