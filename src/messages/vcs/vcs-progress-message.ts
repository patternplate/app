import {VCSBaseMessage} from "./vcs-base";

export interface TransferProgress {
  indexedDeltas(): number;
  indexedObjects(): number;
  localObjects(): number;
  receivedBytes(): number;
  receivedObjects(): number;
  totalDeltas(): number;
  totalObjects(): number;
}

export class VCSProgressMessage extends VCSBaseMessage {
  public readonly transferProgress: TransferProgress;

  constructor(tid: string, p: any) {
    super(tid);
    this.transferProgress = p as TransferProgress;
  }
};
