import {VCSBaseMessage} from "./vcs-base";

export class VCSRemoveResponse extends VCSBaseMessage {
  public readonly id: string;

  constructor(tid: string, id: string) {
    super(tid);
    this.id = id;
  }
};
