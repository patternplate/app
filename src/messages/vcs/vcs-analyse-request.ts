import {Message} from "../message";

export class VCSAnalyseRequest extends Message {
  static is(input: any) {
    return input instanceof VCSAnalyseRequest;
  }
};
