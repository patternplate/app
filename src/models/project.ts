import * as crypto from "crypto";
import { Repository } from "./repository";

enum NodeModulesState {
 Unknown = 0,
 NeedsInstall = 1,
 Installed = 2,
 Error = 3
}

export interface ProjectInit {
  repository: Repository;
}

const sha256 = (input: string): string => {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export class Project {
  private id: string;
  private repository: Repository;

  static fromUrl(url: string) {
    const repository = new Repository({url});
    return new Project({
      repository
    });
  }

  constructor(init: ProjectInit) {
    this.repository = init.repository;
    this.id = sha256(`project:${this.repository.getId()}`);
  }

  getId(): string {
    return this.id;
  }
}
