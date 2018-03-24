import * as Messages from ".";
import {Message} from "../message";

export class VCSMessage extends Message {
  static is(input: any) {
    return Messages.VCSCloneEndNotification.is(input) ||
      Messages.VCSCloneStartNotification.is(input) ||
      Messages.VCSErrorNotification.is(input) ||
      Messages.VCSPathRequest.is(input) ||
      Messages.VCSPathResponse.is(input) ||
      Messages.VCSProgressNotification.is(input) ||
      Messages.VCSRemoveRequest.is(input) ||
      Messages.VCSRemoveResponse.is(input) ||
      Messages.VCSRetryNotification.is(input);
  }
};
