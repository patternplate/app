import {Project} from "../../models/project";
import {Message} from "../message";

export class ProjectStartRequest extends Message {
  public readonly project: Project;

  static is(input: any) {
    return input instanceof ProjectStartRequest;
  }

  constructor(tid: string, project: Project) {
    super(tid);
    this.project = project;
  }
};
