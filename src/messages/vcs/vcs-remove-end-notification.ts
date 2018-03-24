import {Message} from "../message";

export class VCSRemoveEndNotification extends Message {
  static is(input: any) {
    return input instanceof VCSRemoveEndNotification;
  }
};
