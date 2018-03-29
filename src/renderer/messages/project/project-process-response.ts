import {Project} from "../../models/project";
import {Message} from "../message";

export class ProjectProcessResponse extends Message {
  public readonly project: Project;

  static is(input: any) {
    return input instanceof ProjectProcessResponse;
  }

  constructor(tid: string, project: Project) {
    super(tid);
    this.project = project;
  }
};
