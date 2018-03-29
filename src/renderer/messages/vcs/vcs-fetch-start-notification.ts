import {Message} from "../message";

export interface VCSFetchInit {
  url: string;
  path: string;
}

export class VCSFetchStartNotification extends Message {
  public readonly url: string;
  public readonly path: string;

  static is(input: any) {
    return input instanceof VCSFetchStartNotification;
  }

  constructor(tid: string, init: VCSFetchInit) {
    super(tid);
    this.url = init.url;
    this.path = init.path;
  }
};
