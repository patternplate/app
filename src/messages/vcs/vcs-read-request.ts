import {Message} from "../message";

export class VCSReadRequest extends Message {
  static is(input: any) {
    return input instanceof VCSReadRequest;
  }
};
