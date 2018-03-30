import {Message} from "../message";

export class ContextMenuRequest extends Message {
  public readonly el: Element;

  static is(input: any) {
    return input instanceof ContextMenuRequest;
  }

  constructor(tid: string, el: Element) {
    super(tid);
    this.el = el;
  }
};
