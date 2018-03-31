import {Message} from "../message";

export class ProjectDiscardNotification extends Message {
  public readonly id: string;

  static is(input: any) {
    return input instanceof ProjectDiscardNotification;
  }

  constructor(tid: string, id: string) {
    super(tid);
    this.id = id;
  }
};
