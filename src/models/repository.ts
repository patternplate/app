import * as crypto from "crypto";
import * as tempy from "tempy";

enum VersionControlState {
  Unknown = 0,
  NeedsClone = 1,
  NeedsPull = 2,
  Synced = 3,
  Error = 4
}

interface RepositoryInit {
  path: string;
  url: string;
}

const sha256 = (input: string): string => {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export class Repository {
  private vcsState: VersionControlState;
  private id: string;
  private path: string;
  private url: string;

  static fromUrl(url: string): Repository {
    return new Repository({
      url,
      path: tempy.directory()
    });
  }

  constructor(init: RepositoryInit) {
    this.path = init.path;
    this.url = init.path;
    this.id = sha256(`${this.path}:${this.url}`);
  }

  getId() {
    return this.id;
  }
}
