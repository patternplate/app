import {Message} from "../message";

export interface ProjectSavePayload {
  success: boolean;
}

export class ProjectSaveResponse extends Message {
  public readonly payload: ProjectSavePayload;

  static is(input: any) {
    return input instanceof ProjectSaveResponse;
  }

  constructor(tid: string, payload: ProjectSavePayload) {
    super(tid);
    this.payload = payload;
  }
};
