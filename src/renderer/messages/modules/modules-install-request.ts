import {Message} from "../message";

export class ModulesInstallRequest extends Message {
  static is(input: any) {
    return input instanceof ModulesInstallRequest;
  }
};
