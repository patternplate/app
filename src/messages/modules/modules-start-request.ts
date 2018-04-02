import {Message} from "../message";

export class ModulesStartRequest extends Message {
  public readonly open: boolean = true;

  static is(input: any) {
    return input instanceof ModulesStartRequest;
  }

  constructor(tid: string, opts?: {open: boolean}) {
    super(tid);
    if (opts) {
      this.open = opts.open;
    }
  }
};
