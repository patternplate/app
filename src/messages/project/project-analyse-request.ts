import {Message} from "../message";

export class ProjectAnalyseRequest extends Message {
  static is(input: any) {
    return input instanceof ProjectAnalyseRequest;
  }
};
