import {Message} from "../message";

export interface PatternplatInstance {
  port: number;
  cwd: string;
  open: boolean;
}

export class ModulesStartStartedNotification extends Message {
  public readonly patternplate: PatternplatInstance;
  public readonly id: string;
  public readonly open: boolean = true;

  static is(input: any) {
    return input instanceof ModulesStartStartedNotification;
  }

  constructor(tid: string, id: string, instance: PatternplatInstance) {
    super(tid);
    this.id = id;
    this.patternplate = instance;
    this.open = instance.open;
  }
};
