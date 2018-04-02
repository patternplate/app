import {Message} from "../message";

export class ProjectOpenRequest extends Message {
  public readonly id: string;

  static is(input: any) {
    return input instanceof ProjectOpenRequest;
  }

  constructor(tid: string, id: string) {
    super(tid);
    this.id = id;
  }
};
