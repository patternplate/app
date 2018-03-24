import {Message} from "../message";

export class VCSRemoveRequest extends Message {
  static is(input: any) {
    return input instanceof VCSRemoveRequest;
  }
};
