import {Message} from "../message";

export class ProjectUrlResponse extends Message {
  public readonly url: string;

  static is(input: any) {
    return input instanceof ProjectUrlResponse;
  }

  constructor(tid: string, url: string) {
    super(tid);
    this.url = url;
  }
};
