import * as Os from "os";
import * as Path from "path";
import { action, observable, computed } from "mobx";
import { Observable, Subject } from "rxjs";
import { merge } from 'rxjs/observable/merge';

import * as Msg from "../messages";
import { Project } from "../models/project";
import { ProjectViewModel } from "./project";

const ARSON = require("arson");

export interface ProjectViewCollectionInit {
  store: any;
  items: ProjectViewModel[];
}

export class ProjectViewCollection {
  private store: any;
  private up: Observable<any> = new Subject();
  private down: Observable<any> = new Subject();

  @observable public items: ProjectViewModel[];

  @computed get length(): number {
    return this.items.length;
  }

  static fromStore(store: any) {
    return new ProjectViewCollection({
      store,
      items: store.get("projects")
        .map((serialized: any) => {
          const data = ARSON.parse(serialized);
          const project = Project.from({
            url: data.model.url,
            name: data.model.name,
            path: Path.join(Os.homedir(), "patternplate"),
            previous: data
          });
          return new ProjectViewModel(project);
        })
    });
  }

  private constructor(init: ProjectViewCollectionInit) {
    this.store = init.store;
    this.items = init.items;

    this.items.forEach(item => this.bind(item));
  }

  @action
  addProjectByUrl(url: string): void {
    const model = Project.fromUrl(url);

    const viewModel = new ProjectViewModel(model);
    this.items.push(viewModel);
    this.bind(viewModel);

    this.store.set("projects", this.toStore());
  }

  @action
  removeProject(removal: ProjectViewModel): void {
    this.items.splice(this.items.indexOf(removal), 1);

    this.store.set("projects", this.toStore());
  }

  bind(item: ProjectViewModel) {
    this.up = merge(this.up, item.up);
    this.down = merge(this.down, item.down);

    this.up.subscribe((message: any) => {
      console.log('up', message);
      const match = Msg.match(message);
      match(Msg.VCS.VCSRemoveResponse, () => {
        const index = this.items.findIndex(p => p.id === message.id);
        this.items.splice(index, 1);
      });
    });

    this.down.subscribe((message: any) => {
      console.log('down', message);
    });
  }

  toStore() {
    return this.items.map(p => ARSON.stringify(p));
  }
}
