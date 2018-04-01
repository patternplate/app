import {Message} from "../message";

export class ProjectReadRequest extends Message {
  static is(input: any) {
    return input instanceof ProjectReadRequest;
  }
};
