import * as crypto from "crypto";
import * as tempy from "tempy";
import { observable } from "mobx";
import * as uuid from "uuid";

import { Git, VCS } from "./git";
import { Channel } from "./nextable";

enum VersionControlState {
  Unknown = 0,
  NeedsClone = 1,
  NeedsPull = 2,
  Synced = 3,
  Error = 4
}

interface RepositoryInit {
  url: string;
}

export class Repository {
  public readonly id: string;
  public readonly vcs: VCS;

  @observable vcsState: VersionControlState;
  @observable url: string;

  static fromUrl(url: string): Repository {
    return new Repository({ url });
  }

  constructor(init: RepositoryInit) {
    this.url = init.url;
    this.id = uuid.v4();
    this.vcs = new Git(this);
  }

  clone(host: Channel) {
    this.vcs.clone(host);
  }

  remove(host: Channel) {
    this.vcs.remove(host);
  }
}
