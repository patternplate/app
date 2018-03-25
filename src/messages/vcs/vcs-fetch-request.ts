import {Message} from "../message";

export class VCSFetchRequest extends Message {
  static is(input: any) {
    return input instanceof VCSFetchRequest;
  }
};
