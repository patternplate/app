import { action, observable, computed } from "mobx";
import { Observable, Subject } from "rxjs";
import { merge } from 'rxjs/observable/merge';

import * as Msg from "../../messages";
import { Project, ProjectOptions } from "../../models/project";
import { ProjectViewModel, ProjectViewState } from "./project";

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
  @observable public activeProject: string | null = null;

  @computed get length(): number {
    return this.items.length;
  }

  @computed get startedProjects(): ProjectViewModel[] {
    return this.items.filter(i => i.isStarted());
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
            path: data.model.path,
            previous: data,
            managed: data.model.managed
          });
          return new ProjectViewModel(project);
        })
    });
  }

  private constructor(init: ProjectViewCollectionInit) {
    this.store = init.store;
    this.items = init.items;

    this.items.forEach(item => this.bind(item));
    this.listen();
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
    this.listen();

    this.store.set("projects", this.toStore());
    return viewModel;
  }

  @action
  addProjectByPath(path: string): ProjectViewModel | null {
    const previous = this.items.find(p => p.path === path);

    if (previous) {
      previous.setHighlighted();
      return null;
    }

    const model = Project.fromPath(path);
    const viewModel = new ProjectViewModel(model);

    this.bind(viewModel);
    this.listen();

    model.up.subscribe((message: any) => {
      const match = Msg.match(message);

      match(Msg.Project.ProjectReadResponse, () => {
        if (message.tid !== model.id) {
          return;
        }

        viewModel.setState(ProjectViewState.Built);

        this.items.unshift(viewModel);
        this.store.set("projects", this.toStore());
      });
    });

    model.read();
    return viewModel;
  }

  @action
  addEmptyProject(): ProjectViewModel | null {
    const editable = this.items.find(i => i.editable);

    if (editable) {
      editable.setHighlighted();
      return null;
    }

    const empty = ProjectViewModel.createEmpty();
    this.items.unshift(empty);
    this.bind(empty);
    this.listen();

    return empty;
  }

  @action
  removeProject(removal: ProjectViewModel): void {
    this.items.splice(this.items.indexOf(removal), 1);

    this.store.set("projects", this.toStore());
  }

  @action
  setActiveProject(id: string | null): void {
    this.activeProject = id;
  }

  bind(item: ProjectViewModel) {
    item.up.subscribe(message => (this.up as Subject<any>).next(message));
    item.down.subscribe(message => (this.down as Subject<any>).next(message));
  }

  listen() {
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

      match(Msg.Project.ProjectOpenRequest, () => {
        this.setActiveProject(message.id);
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


