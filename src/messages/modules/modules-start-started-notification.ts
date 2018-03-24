import {Message} from "../message";

export interface PatternplatInstance {
  port: number;
  cwd: string;
}

export class ModulesStartStartedNotification extends Message {
  public readonly patternplate: PatternplatInstance;

  static is(input: any) {
    return input instanceof ModulesStartStartedNotification;
  }

  constructor(tid: string, instance: PatternplatInstance) {
    super(tid);
    this.patternplate = instance;
  }
};
