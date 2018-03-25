import {Message} from "../message";

export interface VCSAnalyseResponseInit {
  exists: boolean;
  hash: string;
  synced: boolean;
  diff: VCSDiffFile[];
}

export enum VCSDiffFileStatus {
  Deleted = "deleted",
  Added = "added",
  Modified = "modified"
}

export interface VCSDiffFile {
  hunks: string[];
  path: string;
  sha: string;
  sha1: string;
  size: number;
  status: VCSDiffFileStatus;
}

export class VCSAnalyseResponse extends Message {
  public readonly exists: boolean;
  public readonly hash: string;
  public readonly remote: string;
  public readonly synced: boolean;
  public readonly diff: VCSDiffFile[];

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
