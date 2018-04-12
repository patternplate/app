import {Message} from "../message";

export class ProjectUrlRequest extends Message {
  static is(input: any) {
    return input instanceof ProjectUrlRequest;
  }
};
