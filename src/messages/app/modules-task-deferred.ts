import {Message} from "../message";

export class ModulesTaskDeferred extends Message {
  task: Message;

  static is(input: any) {
    return input instanceof ModulesTaskDeferred;
  }

  constructor(tid: string, task: Message) {
    super(tid);
    this.task = task;
  }
};
