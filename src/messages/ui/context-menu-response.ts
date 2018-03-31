import {Message} from "../message";
import {ProjectViewModel} from "../../renderer/view-models";

export class ContextMenuResponse extends Message {
  public readonly project: ProjectViewModel;

  static is(input: any) {
    return input instanceof ContextMenuResponse;
  }

  constructor(tid: string, project: ProjectViewModel) {
    super(tid);
    this.project = project;
  }
};
