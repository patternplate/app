import {Message} from "../message";

export interface VCSFetchInit {
  url: string;
  path: string;
  diff: any;
}

export class VCSFetchEndNotification extends Message {
  public readonly url: string;
  public readonly path: string;
  public readonly diff: any;

  static is(input: any) {
    return input instanceof VCSFetchEndNotification;
  }

  constructor(tid: string, init: VCSFetchInit) {
    super(tid);
    this.url = init.url;
    this.path = init.path;
    this.diff = init.diff;
  }
};
