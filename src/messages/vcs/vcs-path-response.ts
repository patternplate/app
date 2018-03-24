import {Message} from "../message";

export class VCSPathResponse extends Message {
  public readonly path: string;

  static is(input: any) {
    return input instanceof VCSPathResponse;
  }

  constructor(tid: string, path: string) {
    super(tid);
    this.path = path;
  }
};
