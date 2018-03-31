import {Message} from "../message";

export class ModulesConfigureRequest extends Message {
  static is(input: any) {
    return input instanceof ModulesConfigureRequest;
  }
};
