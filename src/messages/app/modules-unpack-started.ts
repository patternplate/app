import {Message} from "../message";

export class ModulesUnpackStarted extends Message {
  static is(input: any) {
    return input instanceof ModulesUnpackStarted;
  }
};
