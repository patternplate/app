import {Message} from "../message";

export class ModulesStopRequest extends Message {
  static is(input: any) {
    return input instanceof ModulesStopRequest;
  }
};
