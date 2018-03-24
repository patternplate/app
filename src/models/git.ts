import * as Path from "path";
import * as uuid from "uuid";

import * as Msg from "../messages";
import {VCS} from "../messages";
import {Channel} from "./nextable";

const nodegit = require("nodegit");
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

      match(Msg.VCS.VCSCloneRequest, () => this.clone());
      match(Msg.VCS.VCSRemoveRequest, () => this.remove());
    });
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

  fetch() {
    // Not implemented yet
  }

  remove() {
    sander.rimraf(this.host.path)
      .then(() => this.host.up.next(new VCS.VCSRemoveResponse(this.host.id, (this.host as any).id)));
  }
}
