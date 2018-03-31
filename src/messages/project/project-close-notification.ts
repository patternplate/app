import {Message} from "../message";

export class ProjectCloseNotification extends Message {
  public readonly id: string;

  static is(input: any) {
    return input instanceof ProjectCloseNotification;
  }

  constructor(tid: string, id: string) {
    super(tid);
    this.id = id;
  }
};
