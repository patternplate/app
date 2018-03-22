import {VCSBaseMessage} from "./vcs-base";

export class VCSPathResponse extends VCSBaseMessage {
  public readonly path: string;

  constructor(tid: string, path: string) {
    super(tid);
    this.path = path;
  }
};
