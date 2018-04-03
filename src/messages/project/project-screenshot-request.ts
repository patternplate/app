import {Message} from "../message";

export class ProjectScreenshotRequest extends Message {
  static is(input: any) {
    return input instanceof ProjectScreenshotRequest;
  }
};
