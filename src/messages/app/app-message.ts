import {ModulesUnpackError, ModulesUnpackReady, ModulesUnpackStarted} from ".";

export class AppMessage {
  static is(input: any) {
    return ModulesUnpackError.is(input) || ModulesUnpackReady.is(input) || ModulesUnpackStarted.is(input);
  }
}
