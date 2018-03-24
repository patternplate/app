import {Message} from "../message";

export class VCSPathRequest extends Message {
  static is(input: any) {
    return input instanceof VCSPathRequest;
  }
};
