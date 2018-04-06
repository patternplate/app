import {Message} from "../message";

export class ProjectUnlistRequest extends Message {
  public readonly id: string;

  static is(input: any) {
    return input instanceof ProjectUnlistRequest;
  }

  constructor(tid: string, id: string) {
    super(tid);
    this.id = id;
  }
};
