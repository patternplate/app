import * as Os from "os";
import * as Path from "path";
import * as Crypto from "crypto";
import { Subject } from "rxjs";
import * as uuid from "uuid";

import { Channel } from "./nextable";
import { Repository } from "./repository";

import {
  ProjectBaseMessage,
  ProjectUnprocessedMessage,
  ProjectProcessingMessage
} from "../messages/project";

import {
  VCSErrorMessage,
  VCSCloneEndMessage,
  VCSCloneStartMessage,
  VCSBaseMessage,
  VCSPathRequest,
  VCSPathResponse,
  VCSRemoveRequest
} from "../messages/vcs";

export enum ProjectState {
  Unprocessed = "UNPROCESSED",
  Processing = "PROCESSING",
  Fetching = "FETCHING",
  Fetched = "FETCHED",
  NeedsInstall = "NEEDS_INSTALL",
  Installed = "INSTALLED",
  Error = "ERROR",
  Undefined = "UNDEFINED"
}

export interface ProjectInit {
  repository: Repository;
}

export class Project implements Channel {
  private messages: (VCSBaseMessage | ProjectBaseMessage)[] = [];

  public readonly id: string;
  public readonly up: Subject<any> = new Subject();
  public readonly down: Subject<any> = new Subject();

  repository: Repository;

  static fromUrl(url: string) {
    const project = new Project({
      repository: Repository.fromUrl(url)
    });

    return project;
  }

  constructor(init: ProjectInit) {
    this.repository = init.repository;
    this.id = uuid.v4();

    this.up.subscribe((message: any) => {
      if (message instanceof VCSPathRequest) {
        this.down.next(
          new VCSPathResponse(
            message.tid,
            Path.join(Os.homedir(), "patternplate")
          )
        );
      }
    });

    this.up.next(new ProjectUnprocessedMessage(this.id, this));
  }

  subscribe(fn: (payload: Project) => void) {
    this.up.subscribe(fn);
    this.down.subscribe(fn);
    fn(this);
  }

  process() {
    this.up.next(new ProjectProcessingMessage(this.id, this));
    this.repository.clone(this);
    return this;
  }

  remove() {
    this.down.next(new VCSRemoveRequest(this.id));
    this.repository.remove(this);
    return this;
  }
}
