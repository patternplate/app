import {Message} from "../message";

export class ProjectSaveNotification extends Message {
  public readonly payload: ProjectSaveNotification ;

  static is(input: any) {
    return input instanceof ProjectSaveNotification ;
  }

  constructor(tid: string, payload: any) {
    super(tid);
    this.payload = payload;
  }
};
