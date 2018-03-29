import {Message} from "../message";

export interface VCSCloneInit {
  url: string;
  path: string;
}

export class VCSCloneEndNotification extends Message {
  public readonly url: string;
  public readonly path: string;

  static is(input: any) {
    return input instanceof VCSCloneEndNotification;
  }

  constructor(tid: string, init: VCSCloneInit) {
    super(tid);
    this.url = init.url;
    this.path = init.path;
  }
};
