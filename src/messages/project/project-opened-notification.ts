import {Message} from "../message";

export class ProjectOpenedNotification extends Message {
  static is(input: any) {
    return input instanceof ProjectOpenedNotification;
  }
};
