import {Message} from "../message";

export class ModulesUnpackReady extends Message {
  static is(input: any) {
    return input instanceof ModulesUnpackReady;
  }
};
