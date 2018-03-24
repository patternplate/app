import {Project} from "../../models/project";
import {Message} from "../message";

export class ProjectOpenNotification extends Message {
  public readonly id: string;

  static is(input: any) {
    return input instanceof ProjectOpenNotification;
  }

  constructor(tid: string, id: string) {
    super(tid);
    this.id = id;
  }
};
