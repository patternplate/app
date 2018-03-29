import {Message} from "../message";

export interface TransferProgress {
  indexedDeltas(): number;
  indexedObjects(): number;
  localObjects(): number;
  receivedBytes(): number;
  receivedObjects(): number;
  totalDeltas(): number;
  totalObjects(): number;
}

export class VCSProgressNotification extends Message {
  public readonly transferProgress: TransferProgress;

  static is(input: any) {
    return input instanceof VCSProgressNotification;
  }

  constructor(tid: string, p: any) {
    super(tid);
    this.transferProgress = p as TransferProgress;
  }
};
