import * as Messages from ".";
import {Message} from "../message";

export class ProjectMessage extends Message {
  static is(input: any) {
    return Messages.ProjectInstallRequest.is(input) ||
      Messages.ProjectProcessRequest.is(input) ||
      Messages.ProjectProcessRequest.is(input) ||
      Messages.ProjectProcessResponse.is(input);
  }
};
