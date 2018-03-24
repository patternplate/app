import {Message} from "../message";

export class VCSErrorNotification extends Message {
  public readonly error: Error;

  static is(input: any) {
    return input instanceof VCSErrorNotification;
  }

  constructor(tid: string, error: Error) {
    super(tid);
    this.error = error;
  }
};
