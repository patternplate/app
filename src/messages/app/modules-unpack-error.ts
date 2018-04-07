import {Message} from "../message";

export class ModulesUnpackError extends Message {
  static is(input: any) {
    return input instanceof ModulesUnpackError;
  }
};
