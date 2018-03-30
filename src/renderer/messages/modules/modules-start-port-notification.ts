import {Message} from "../message";

export class ModulesStartPortNotification extends Message {
  public readonly port: number;

  static is(input: any) {
    return input instanceof ModulesStartPortNotification;
  }

  constructor(tid: string, port: number) {
    super(tid);
    this.port = port;
  }
};
