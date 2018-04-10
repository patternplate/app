import * as Path from "path";
import * as Url from "url";
import * as uuid from "uuid";
import * as loadJsonFile from "load-json-file";
import {BehaviorSubject} from "rxjs";
import * as execa from "execa";

import * as Msg from "../messages";
import {VCS} from "../messages";
import {Channel} from "./nextable";
import {fork} from "../fork";

const sander = require("@marionebl/sander");
const gitUrlParse = require("git-url-parse");

// Ensure bins uses here are available in node_modules
require("npm/package");
require("yarn/package");
require("rimraf/package");

export interface VersionControl {
  clone(token?: string): void;
  fetch(token?: string): void;
  remove(token?: string): void;
}

export interface VersionControllable extends Channel {
  id: string;
  path: string;
  basePath: string;
  url: string;
}

const STATIC_BASE = process.env.NODE_ENV === "production"
  ? (process as any).resourcesPath
  : Path.resolve(__dirname, "..", "..");

const GIT = Path.join(STATIC_BASE, "static", "git", "macos", "bin", "git");
const GIT_EXEC_PATH = Path.dirname(GIT);
const GIT_TERMINAL_PROMPT = "0";

export class Git<T extends VersionControllable> implements VersionControl {
  readonly host: T;
  private appReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(host: T) {
    this.host = host;

    this.host.down
      .filter(Msg.App.AppMessage.is)
      .map((message: any) => {
        if (Msg.App.ModulesUnpackReady.is(message)) {
          return true;
        }
        return false;
      })
      .subscribe(this.appReady);

    this.host.down.subscribe((message: any) => {
      const match = Msg.match(message);

      match(Msg.VCS.VCSAnalyseRequest, () => this.analyse());
      match(Msg.VCS.VCSReadRequest, () => this.read(message.tid));
      match(Msg.VCS.VCSCloneRequest, () => this.clone());
      match(Msg.VCS.VCSFetchRequest, () => this.fetch());
      match(Msg.VCS.VCSRemoveRequest, () => this.remove());
    });
  }

  async analyse() {
    if (!this.host.path || this.host.path === process.cwd()) {
      return;
    }

    const exists = await sander.exists(this.host.path);

    if (!exists) {
      return this.host.up.next(new VCS.VCSAnalyseResponse(this.host.id, {
        exists: false,
        hash: null,
        synced: null,
        diff: []
      }));
    }

    const result = await execa(GIT, ["rev-parse", "HEAD"], {cwd: this.host.path})
      .catch(() => {
        this.host.up.next(new VCS.VCSAnalyseResponse(this.host.id, {
          exists: false,
          hash: null,
          synced: null,
          diff: []
        }));
      });

    const hash = result ? result.stdout : null;

    if (!hash) {
      return this.host.up.next(new VCS.VCSAnalyseResponse(this.host.id, {
        exists,
        hash: null,
        synced: null,
        diff: []
      }));
    }

    const git = authorizingGit({context: this, tid: this.host.id});
    await git(["fetch", "origin", "master"], {cwd: this.host.path});

    // TODO: Fetch here
    const diffResult = await execa(GIT, ["log", "master..origin/master", "--oneline", "--format=format:%H"], {
      cwd: this.host.path,
      env: {
        GIT_EXEC_PATH,
        GIT_TERMINAL_PROMPT
      }
    })
      .catch(() => {
        return this.host.up.next(new VCS.VCSAnalyseResponse(this.host.id, {
          exists,
          hash,
          synced: null,
          diff: []
        }));
      });

    if (!diffResult) {
      return this.host.up.next(new VCS.VCSAnalyseResponse(this.host.id, {
        exists,
        hash,
        synced: null,
        diff: []
      }));
    }

    const diff = diffResult.stdout.split("\n").filter(Boolean);

    this.host.up.next(new VCS.VCSAnalyseResponse(this.host.id, {
      exists,
      hash,
      synced: diff.length === 0,
      diff
    }));
  }

  async read(tid: string) {
    if (!this.host.path || this.host.path === process.cwd()) {
      return;
    }

    const urlResult = await execa(GIT, ["config", "--get", "remote.origin.url"], {
      cwd: this.host.path
    }).catch(err => { console.error(err); });

    if (urlResult) {
      const url = urlResult.stdout;
      const parsed = gitUrlParse(url);

      return this.host.up.next(new VCS.VCSReadResponse(tid, {
        name: parsed.full_name,
        url
      }));
    }

    loadJsonFile(Path.join(this.host.path, 'package.json'))
      .then((pkg: any) => {
        const name = pkg.name;
        const url = pkg.repository && pkg.repository.url ? pkg.repository.url : null;
        return this.host.up.next(new VCS.VCSReadResponse(tid, {name, url}));
      });
  }

  async clone(token?: string) {
    const host = this.host;
    const tid = uuid.v4();

    host.up.next(new VCS.VCSCloneStartNotification(tid, {
      url: this.host.url,
      path: this.host.path
    }));

    if (!await sander.exists(Path.dirname(host.path))) {
      await sander.mkdir(Path.dirname(host.path));
    }

    const parsed = Url.parse(this.host.url);

    if (token) {
      parsed.auth = ['oauth2', token].join(':');
    }

    const url = Url.format(parsed);
    const git = authorizingGit({context: this, tid});

    await git(["clone", url, host.path])
      .catch((err: Error) => {
        host.up.next(new VCS.VCSErrorNotification(tid, err));
      })
      .then((code) => {
        host.up.next(new VCS.VCSCloneEndNotification(tid, {
          url: host.url,
          path: host.path
        }));
      });
  }

  async fetch(token?: string) {
    const tid = uuid.v4();

    this.host.up.next(new VCS.VCSFetchStartNotification(tid, {
      url: this.host.url,
      path: this.host.path
    }));

    const parsed = Url.parse(this.host.url);

    if (token) {
      parsed.auth = ['oauth2', token].join(':');
    }

    const git = authorizingGit({context: this, tid});
    await git(["remote", "update"], {cwd: this.host.path});

    const result = await execa(GIT, ["log", "master..origin/master", "--oneline", "--format=format:%H"], {
      cwd: this.host.path,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        GIT_EXEC_PATH,
        GIT_TERMINAL_PROMPT
      }
    });

    const diff = result.stdout.split("\n").filter(Boolean);

    if (diff.length === 0) {
      return this.host.up.next(new VCS.VCSFetchEndNotification(tid, {
        url: this.host.url,
        path: this.host.path,
        diff: []
      }));
    }

    git(["pull"], { cwd: this.host.path })
      .catch((err: Error) => {
        this.host.up.next(new VCS.VCSErrorNotification(tid, err));
      })
      .then((result) => {
        this.host.up.next(new VCS.VCSFetchEndNotification(tid, {
          url: this.host.url,
          path: this.host.path,
          diff
        }));
      });
  }

  remove() {
    const RIMRAF = Path.join(this.host.basePath, "node", "node_modules", ".bin", "rimraf");

    if (!this.host.path || this.host.path === process.cwd()) {
      this.host.up.next(new VCS.VCSRemoveResponse(this.host.id, (this.host as any).id));
      return;
    }

    this.host.up.next(new VCS.VCSRemoveStartNotification(this.host.id));

    if (!this.appReady.getValue()) {
      this.appReady
        .skipWhile((val) => !val)
        .subscribe(() => this.remove());
      return;
    }

    fork(RIMRAF, [this.host.path])
      .catch(err => {
        console.error(err);
        // TODO: Not implemented yet, emit critical errors here
      })
      .then(() => {
        this.host.up.next(new VCS.VCSRemoveEndNotification(this.host.id));
        this.host.up.next(new VCS.VCSRemoveResponse(this.host.id, (this.host as any).id));
      });
  }
}

interface AuthorizingGitInit {
  tid: string;
  context: Git<VersionControllable>;
}

const authorizingGit = (init: AuthorizingGitInit) => {
  const {context, tid} = init;
  const parsed = Url.parse(context.host.url);

  return (args: string[], options: any = {}) => {
    return execa(GIT,
      [
        "-c", "credential.helper=",
        ...args
      ],
      {
        env: {
          GIT_EXEC_PATH,
          GIT_TERMINAL_PROMPT
        },
        ...options
    }).catch(err => {
      if (err.stderr.indexOf("terminal prompts disabled") > -1 && parsed.protocol === "https:") {
        context.host.down.subscribe((message: any) => {
          if (message.tid !== tid) {
            return;
          }

          const match = Msg.match(message);

          match(Msg.VCS.VCSCredentialAnswer, () => {
            if (message.host !== parsed.host) {
              return;
            }

            context.clone(message.token);
          });
        });

        return context.host.up.next(new VCS.VCSCredentialChallenge(tid, context.host.url));
      }

      throw err;
    });
  };
}
