import {Message} from "../message";

export class ProjectConfigureRequest extends Message {
  static is(input: any) {
    return input instanceof ProjectConfigureRequest;
  }
};
