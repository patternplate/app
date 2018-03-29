import {Message} from "../message";

export class VCSRemoveStartNotification extends Message {
  static is(input: any) {
    return input instanceof VCSRemoveStartNotification;
  }
};
