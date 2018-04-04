import {Message} from "../message";

interface VCSCredentialAnswerInit {
  host: string;
  token: string;
}

export class VCSCredentialAnswer extends Message {
  public readonly host: string;
  public readonly token: string;

  static is(input: any) {
    return input instanceof VCSCredentialAnswer;
  }

  constructor(tid: string, init: VCSCredentialAnswerInit) {
    super(tid);
    this.host = init.host;
    this.token = init.token;
  }
};
