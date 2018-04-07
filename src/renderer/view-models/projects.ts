import { action, observable, computed } from "mobx";
import { Observable, Subject } from "rxjs";

import * as Msg from "../../messages";
import { Project, ProjectOptions } from "../../models/project";
import { ProjectViewModel, ProjectViewState } from "./project";

const ARSON = require("arson");
const electron = require("electron");

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

  static fromStore(store: any, options: ProjectOptions) {
    return new ProjectViewCollection({
      store,
      items: (store.get("projects") || [])
        .map((serialized: any) => {
          const data = ARSON.parse(serialized);
          const project = Project.from({
            id: data.model.id,
            url: data.model.url,
            name: data.model.name,
            path: data.model.path,
            basePath: options.basePath,
            autoStart: options.autoStart,
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
    this.listen();

    // TODO: Wire this up in renderer/index.tsx instead
    electron.ipcRenderer.send("check-modules");
  }

  @action
  addProjectByUrl(url: string, options: ProjectOptions): ProjectViewModel | null {
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

    // TODO: Wire this up in renderer/index.tsx instead
    electron.ipcRenderer.send("check-modules");

    return viewModel;
  }

  @action
  addProjectByPath(path: string, options: ProjectOptions): ProjectViewModel | null {
    const previous = this.items.find(p => p.path === path);

    if (previous) {
      previous.setHighlighted();
      return null;
    }

    const model = Project.fromPath(path, options);
    const viewModel = new ProjectViewModel(model);

    this.bind(viewModel);

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

    // TODO: Wire this up in renderer/index.tsx instead
    electron.ipcRenderer.send("check-modules");

    model.read();
    return viewModel;
  }

  @action
  addEmptyProject(options: ProjectOptions): ProjectViewModel | null {
    const editable = this.items.find(i => i.editable);

    if (editable) {
      editable.setHighlighted();
      return null;
    }

    const empty = ProjectViewModel.createEmpty(options);
    this.items.unshift(empty);
    this.bind(empty);
    this.listen();

    // TODO: Wire this up in renderer/index.tsx instead
    electron.ipcRenderer.send("check-modules");

    return empty;
  }

  @action
  removeProject(removal: ProjectViewModel): void {
    this.items.splice(this.items.indexOf(removal), 1);

    // TODO: Wire this up in renderer/index.tsx instead
    electron.ipcRenderer.send("check-modules");

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

      match(Msg.Project.ProjectUnlistRequest, () => {
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
      .map(p => ARSON.stringify(Object.assign({}, p, {
        id: p.id
      })));
  }
}


