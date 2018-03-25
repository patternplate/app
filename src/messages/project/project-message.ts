import * as Messages from ".";
import {Message} from "../message";

export class ProjectMessage extends Message {
  static is(input: any) {
    return Messages.ProjectBuildRequest.is(input) ||
      Messages.ProjectInstallRequest.is(input) ||
      Messages.ProjectProcessRequest.is(input) ||
      Messages.ProjectProcessResponse.is(input) ||
      Messages.ProjectStartRequest.is(input) ||
      Messages.ProjectOpenNotification.is(input) ||
      Messages.ProjectCloseNotification.is(input) ||
      Messages.ProjectAnalyseRequest.is(input) ||
      Messages.ProjectAnalyseResponse.is(input);
  }
};
