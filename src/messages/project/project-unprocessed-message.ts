import {Project} from "../../models/project";
import {ProjectBaseMessage} from "./project-base-message";

export class ProjectUnprocessedMessage extends ProjectBaseMessage {
  public readonly project: Project;

  constructor(tid: string, project: Project) {
    super(tid);
    this.project = project;
  }
};
