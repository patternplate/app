import {Message} from "../message";

export interface VCSReadResponseInit {
  name: string;
  url: string;
}

export class VCSReadResponse extends Message {
  public readonly name: string;
  public readonly url: string;

  static is(input: any) {
    return input instanceof VCSReadResponse;
  }

  constructor(tid: string, init: VCSReadResponseInit) {
    super(tid);
    this.name = init.name;
    this.url = init.url;
  }
};
