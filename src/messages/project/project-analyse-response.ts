import {Message} from "../message";

export interface AnalyseInit {
  synced: boolean;
  installed: boolean;
  diff: any;
}

export class ProjectAnalyseResponse extends Message {
  public readonly synced: boolean;
  public readonly installed: boolean;
  public readonly diff: any;

  static is(input: any) {
    return input instanceof ProjectAnalyseResponse;
  }

  constructor(tid: string, init: AnalyseInit) {
    super(tid);
    this.synced = init.synced;
    this.installed = init.installed;
    this.diff = init.diff;
  }
};
