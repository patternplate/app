import {Message} from "../message";

export class VCSCredentialChallenge extends Message {
  public readonly url: string;

  static is(input: any) {
    return input instanceof VCSCredentialChallenge;
  }

  constructor(tid: string, url: string) {
    super(tid);
    this.url = url;
  }
};
