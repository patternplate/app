import {Message} from "../message";

export interface ProjectReadResponseInit {
  name: string;
  url: string;
}

export class ProjectReadResponse extends Message {
  public readonly name: string;
  public readonly url: string;

  static is(input: any) {
    return input instanceof ProjectReadResponse;
  }

  constructor(tid: string, init: ProjectReadResponseInit) {
    super(tid);
    this.name = init.name;
    this.url = init.url;
  }
};
