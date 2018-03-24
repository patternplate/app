import {Message} from "../message";

export class VCSRemoveResponse extends Message {
  public readonly id: string;

  static is(input: any) {
    return input instanceof VCSRemoveResponse;
  }

  constructor(tid: string, id: string) {
    super(tid);
    this.id = id;
  }
};
