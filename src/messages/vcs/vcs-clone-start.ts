import {VCSBaseMessage} from "./vcs-base";

export interface VCSCloneInit {
  url: string;
  path: string;
}

export class VCSCloneStartMessage extends VCSBaseMessage {
  public readonly url: string;
  public readonly path: string;

  constructor(tid: string, init: VCSCloneInit) {
    super(tid);
    this.url = init.url;
    this.path = init.path;
  }
};
