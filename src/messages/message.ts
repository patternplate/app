export abstract class Message {
  static is(input: any): boolean {
    return false;
  };

  public readonly tid: string;

  constructor(tid: string) {
    this.tid = tid;
  }
}
