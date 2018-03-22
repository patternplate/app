import {VCSBaseMessage} from "./vcs-base";

export class VCSErrorMessage extends VCSBaseMessage {
  public readonly error: Error;

  constructor(tid: string, error: Error) {
    super(tid);
    this.error = error;
  }
};
