import {Message} from "../message";

export class ModulesConfigureResponse extends Message {
  public readonly payload: any;

  static is(input: any) {
    return input instanceof ModulesConfigureResponse;
  }

  constructor(tid: string, payload: any) {
    super(tid);
    this.payload = payload;
  }
};
