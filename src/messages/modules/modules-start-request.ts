import {Message} from "../message";

export class ModulesStartRequest extends Message {
  static is(input: any) {
    return input instanceof ModulesStartRequest;
  }
};
