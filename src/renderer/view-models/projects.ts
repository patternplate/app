import * as Os from "os";
import * as Path from "path";
import { action, observable, computed } from "mobx";
import { Observable, Subject } from "rxjs";
import { merge } from 'rxjs/observable/merge';

import * as Msg from "../messages";
import { Project, ProjectOptions } from "../models/project";
import { ProjectViewModel } from "./project";

const ARSON = require("arson");

export interface ProjectViewCollectionInit {
  store: any;
  items: ProjectViewModel[];
}

export class ProjectViewCollection {
  private store: any;
  public up: Observable<any> = new Subject();
  public down: Observable<any> = new Subject();

  @observable public items: ProjectViewModel[];

  @computed get length(): number {
    return this.items.length;
  }

  @computed get startedProject() {
    return this.items.find(item => item.isStarted());
  }

  static fromStore(store: any) {
    return new ProjectViewCollection({
      store,
      items: (store.get("projects") || [])
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
  addProjectByUrl(url: string, options?: ProjectOptions): ProjectViewModel | null {
    const previous = this.items.find(p => p.url === url);

    if (previous) {
      previous.setHighlighted();
      return null;
    }

    const model = Project.fromUrl(url, options);

    const viewModel = new ProjectViewModel(model);
    this.items.push(viewModel);
    this.bind(viewModel);

    this.store.set("projects", this.toStore());
    return viewModel;
  }

  @action
  addEmptyProject(): void {
    const editable = this.items.find(i => i.editable);

    if (editable) {
      editable.setHighlighted();
      return;
    }

    const empty = ProjectViewModel.createEmpty();
    this.items.unshift(empty);
    this.bind(empty);
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
        const project = this.items.find(item => item.id === message.id);
        if (project) {
          this.removeProject(project);
        }
      });

      match(Msg.Project.ProjectSaveRequest, () => {
        const project = this.items.find(item => item.url === message.project.url);

        if (project) {
          project.setHighlighted();
        }

        message.project.up.next(new Msg.Project.ProjectSaveResponse(message.tid, {
          success: !project
        }));
      });

      match(Msg.Project.ProjectSaveNotification, () => {
        this.store.set("projects", this.toStore());
      });

      match(Msg.Project.ProjectDiscardNotification, () => {
        const project = this.items.find(item => item.id === message.id);
        if (project) {
          this.removeProject(project);
        }
      });
    });

    this.down.subscribe((message: any) => {
      console.log('down', message);
    });
  }

  broadcast(payload: any) {
    this.items.map(item => {
      item.down.next(payload);
    })
  }

  toStore() {
    return this.items
      .filter(p => !p.editable)
      .map(p => ARSON.stringify(p));
  }
}


