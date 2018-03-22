import {VCSBaseMessage} from "./vcs-base";

export class VCSRetryMessage extends VCSBaseMessage {
  public readonly count: number;

  constructor(tid: string, count: number) {
    super(tid);
    this.count = count;
  }
};
