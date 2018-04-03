import {Message} from "../message";

export interface ProjectScreenshotNotificationInit {
  project: string;
  image: string;
}

export class ProjectScreenshotNotification extends Message {
  public readonly project: string;
  public readonly image: string;

  static is(input: any) {
    return input instanceof ProjectScreenshotNotification;
  }

  constructor(tid: string, init: ProjectScreenshotNotificationInit) {
    super(tid);
    this.project = init.project;
    this.image = init.image;
  }
};
