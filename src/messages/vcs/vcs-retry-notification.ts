import {Message} from "../message";

export class VCSRetryNotification extends Message {
  public readonly count: number;

  static is(input: any) {
    return input instanceof VCSRetryNotification;
  }

  constructor(tid: string, count: number) {
    super(tid);
    this.count = count;
  }
};
