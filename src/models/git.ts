import * as Path from "path";
import * as uuid from "uuid";

import {Channel} from "./nextable";
import {Repository} from "./repository";

import {
  VCSProgressMessage,
  VCSCloneStartMessage,
  VCSCloneEndMessage,
  VCSErrorMessage,
  VCSRetryMessage,
  VCSPathRequest,
  VCSPathResponse,
  VCSRemoveResponse
} from "../messages/vcs";

const nodegit = require("nodegit");
const sander = require("@marionebl/sander");
const gitUrlParse = require("git-url-parse");

export interface VCS {
  clone(n: Channel): void;
  fetch(n: Channel): void;
  remove(n: Channel): void;
}

export class Git implements VCS {
  readonly repository: Repository;

  constructor(repository: Repository) {
    this.repository = repository;
  }

  clone(host: Channel) {
    const tid = uuid.v4();

    host.down.subscribe(async (message: any) => {
      if (!(message instanceof VCSPathResponse) || message.tid !== tid) {
        return;
      }

      const resp = message;
      let retries = 0;

      host.up.next(new VCSCloneStartMessage(tid, {
        url: this.repository.url,
        path: resp.path
      }));

      const parsed = gitUrlParse(this.repository.url);
      const path = Path.join(resp.path, parsed.owner, parsed.name);

      if (!await sander.exists(Path.dirname(path))) {
        await sander.mkdir(Path.dirname(path));
      }

      if (await sander.exists(path)) {
        await sander.rimraf(path);
      }

      nodegit.Clone(this.repository.url, path, {
        fetchOpts: {
          callbacks: {
            transferProgress(p: any) {
              return host.up.next(new VCSProgressMessage(tid, p));
            },
            credentials(_: any, username: string) {
              retries++

              if (retries >= 10) {
                return host.up.next(new VCSErrorMessage(tid, new Error(`Could not connect to ssh-agent`)));
              } else if (retries >= 1) {
                return host.up.next(new VCSRetryMessage(tid, retries));
              }

              return nodegit.Cred.sshKeyFromAgent(username);
            }
          }
        }
      })
      .then(() => {
        host.up.next(new VCSCloneEndMessage(tid, {
          url: this.repository.url,
          path: resp.path
        }));
      })
      .catch((err: Error) => {
        host.up.next(new VCSErrorMessage(tid, err));
      })
    });

    host.up.next(new VCSPathRequest(tid));
  }

  fetch(host: Channel) {
    // Not implemented yet
  }

  remove(host: Channel) {
    const tid = uuid.v4();

    host.down.subscribe((message: any) => {
      if (!(message instanceof VCSPathResponse) || message.tid !== tid) {
        return;
      }

      const parsed = gitUrlParse(this.repository.url);
      sander.rimraf(message.path, parsed.owner, parsed.name)
        .then(() => host.up.next(new VCSRemoveResponse(tid, (host as any).id)));
    });

    host.up.next(new VCSPathRequest(tid));
  }
}
