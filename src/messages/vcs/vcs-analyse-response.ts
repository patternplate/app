import {Message} from "../message";

export interface VCSAnalyseResponseInit {
  exists: boolean;
  hash: string;
}

export class VCSAnalyseResponse extends Message {
  public readonly exists: boolean;
  public readonly hash: string;
  public readonly remote: string;

  static is(input: any) {
    return input instanceof VCSAnalyseResponse;
  }

  constructor(tid: string, init: VCSAnalyseResponseInit) {
    super(tid);
    this.exists = init.exists;
    this.hash = init.hash;
  }
};
