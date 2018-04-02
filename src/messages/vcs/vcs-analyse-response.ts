import {Message} from "../message";

export interface VCSAnalyseResponseInit {
  exists: boolean | null;
  hash: string | null;
  synced: boolean | null;
  diff: string[];
}

export class VCSAnalyseResponse extends Message {
  public readonly exists: boolean | null;
  public readonly hash: string | null;
  public readonly synced: boolean | null;
  public readonly diff: string[];

  static is(input: any) {
    return input instanceof VCSAnalyseResponse;
  }

  constructor(tid: string, init: VCSAnalyseResponseInit) {
    super(tid);
    this.exists = init.exists;
    this.hash = init.hash;
    this.synced = init.synced;
    this.diff = init.diff;
  }
};
