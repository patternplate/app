import * as Path from "path";
import * as uuid from "uuid";

import * as Msg from "../messages";
import {VCS} from "../messages";
import {Channel} from "./nextable";

const nodegit = require("nodegit");
const git = require("nodegit-kit");
const sander = require("@marionebl/sander");
const gitUrlParse = require("git-url-parse");

export interface VersionControl {
  clone(n: Channel): void;
  fetch(n: Channel): void;
  remove(n: Channel): void;
}

export interface VersionControllable extends Channel {
  id: string;
  path: string;
  url: string;
}

export class Git<T extends VersionControllable> implements VersionControl {
  readonly host: T;

  constructor(host: T) {
    this.host = host;

    this.host.down.subscribe((message: any) => {
      const match = Msg.match(message);

      match(Msg.VCS.VCSAnalyseRequest, () => this.analyse());
      match(Msg.VCS.VCSCloneRequest, () => this.clone());
      match(Msg.VCS.VCSFetchRequest, () => this.fetch());
      match(Msg.VCS.VCSRemoveRequest, () => this.remove());
    });
  }

  async analyse() {
    const exists = await sander.exists(this.host.path);

    if (!exists) {
      return this.host.up.next(new VCS.VCSAnalyseResponse(this.host.id, {
        exists: false,
        hash: null,
        synced: null,
        diff: []
      }));
    }

    const open = async () => {
      try {
        return await nodegit.Repository.open(this.host.path);
      } catch (err) {
        return null;
      }
    }

    const repo = await open();

    if (!repo) {
      return this.host.up.next(new VCS.VCSAnalyseResponse(this.host.id, {
        exists: false,
        hash: null,
        synced: null,
        diff: []
      }));
    }

    const head = await repo.getHeadCommit();

    if (!head) {
      return this.host.up.next(new VCS.VCSAnalyseResponse(this.host.id, {
        exists,
        hash: null,
        synced: null,
        diff: []
      }));
    }

    const hash = await head.sha();

    if (!hash) {
      return this.host.up.next(new VCS.VCSAnalyseResponse(this.host.id, {
        exists,
        hash,
        synced: null,
        diff: []
      }));
    }

    const remoteCommit = await repo.getReferenceCommit("origin/master");

    if (!remoteCommit) {
      return this.host.up.next(new VCS.VCSAnalyseResponse(this.host.id, {
        exists,
        hash,
        synced: null,
        diff: []
      }));
    }

    const remoteHash = await remoteCommit.sha();
    const synced = remoteHash === hash;
    const diff = await git.diff(repo, remoteHash, hash);

    return this.host.up.next(new VCS.VCSAnalyseResponse(this.host.id, {
      exists,
      hash,
      synced,
      diff
    }));
  }

  async clone() {
    const host = this.host;
    const tid = uuid.v4();
    let retries = 0;

    host.up.next(new VCS.VCSCloneStartNotification(tid, {
      url: this.host.url,
      path: this.host.path
    }));

    if (!await sander.exists(Path.dirname(host.path))) {
      await sander.mkdir(Path.dirname(host.path));
    }

    if (await sander.exists(host.path)) {
      await sander.rimraf(host.path);
    }

    nodegit.Clone(this.host.url, host.path, {
      fetchOpts: {
        callbacks: {
          transferProgress(p: any) {
            return host.up.next(new VCS.VCSProgressNotification(tid, p));
          },
          credentials(_: any, username: string) {
            try {
              retries++

              if (retries >= 10) {
                return host.up.next(new VCS.VCSErrorNotification(tid, new Error(`Could not connect to ssh-agent`)));
              } else if (retries >= 1) {
                return host.up.next(new VCS.VCSRetryNotification(tid, retries));
              }

              return nodegit.Cred.sshKeyFromAgent(username);
            } catch (err) {
              host.up.next(new VCS.VCSErrorNotification(tid, err))
            }
          }
        }
      }
    })
    .then(() => {
      host.up.next(new VCS.VCSCloneEndNotification(tid, {
        url: host.url,
        path: host.path
      }));
    })
    .catch((err: Error) => {
      host.up.next(new VCS.VCSErrorNotification(tid, err));
    })
  }

  async fetch() {
    const tid = uuid.v4();
    let retries = 0;

    this.host.up.next(new VCS.VCSFetchStartNotification(tid, {
      url: this.host.url,
      path: this.host.path
    }));

    try {
      const repo = await nodegit.Repository.open(this.host.path);
      const before = await repo.getHeadCommit();
      const after = await repo.getReferenceCommit("origin/master");
      const diff = await git.diff(repo, before, after);

      await repo.fetch("origin", {
        callbacks: {
          transferProgress(p: any) {
            return this.host.up.next(new VCS.VCSProgressNotification(tid, p));
          },
          credentials(_: any, username: string) {
            try {
              retries++

              if (retries >= 10) {
                return this.host.up.next(new VCS.VCSErrorNotification(tid, new Error(`Could not connect to ssh-agent`)));
              } else if (retries >= 1) {
                return this.host.up.next(new VCS.VCSRetryNotification(tid, retries));
              }

              return nodegit.Cred.sshKeyFromAgent(username);
            } catch (err) {
              this.host.up.next(new VCS.VCSErrorNotification(tid, err))
            }
          }
        }
      });

      await repo.mergeBranches("master", "origin/master");

      this.host.up.next(new VCS.VCSFetchEndNotification(tid, {
        url: this.host.url,
        path: this.host.path,
        diff
      }));
    } catch (err) {
      this.host.up.next(new VCS.VCSErrorNotification(tid, err));
    }
  }

  remove() {
    if (!this.host.path || this.host.path === process.cwd()) {
      return;
    }

    this.host.up.next(new VCS.VCSRemoveStartNotification(this.host.id));
    sander.rimraf(this.host.path)
      .then(() => {
        this.host.up.next(new VCS.VCSRemoveEndNotification(this.host.id));
        this.host.up.next(new VCS.VCSRemoveResponse(this.host.id, (this.host as any).id));
      });
  }
}
