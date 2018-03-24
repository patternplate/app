import * as Os from "os";
import * as Path from "path";
import {Observable, Subject} from "rxjs";
import {merge} from 'rxjs/observable/merge';
import {action, observable, computed} from "mobx";
import * as Msg from "../messages";
import {ProjectViewModel} from "./project";
import {Project} from "../models/project";

const gitUrlParse = require("git-url-parse");

export class StartViewModel {
  private store: any;
  private up: Observable<any> = new Subject();
  private down: Observable<any> = new Subject();

  /* Current value of the git url input */
  @observable input: string = "https://github.com/meetalva/designkit.git";

  /* Known patternplate projects */
  @observable projects: ProjectViewModel[] = [];

  /* Currently active webview src */
  @observable src: null | string;

  @computed get valid(): boolean {
    if (this.input.length === 0) {
      return false;
    }

    try {
      const parsed = gitUrlParse(this.input);
      if (parsed.protocol === "http" || parsed.protocol === "https" || parsed.protocol === "git") {
        return true;
      }
    } catch (err) {
      return false;
    }
  }

  static from(store: any) {
    return new StartViewModel(store);
  }

  constructor(store: any) {
    this.store = store;

    if (store.has("input")) {
      this.input = store.get("input");
    }
  }

  onUpMessage(message: any) {
    console.log('up', message);
    const match = Msg.match(message);

    match(Msg.VCS.VCSRemoveResponse, () => {
      const index = this.projects.findIndex(p => p.model.id === message.id);

      if (index === -1) {
        return;
      }

      this.projects.splice(index, 1);
    });

    match(Msg.Project.ProjectOpenNotification, () => {
      const project = this.projects.find(p => p.model.id === message.id);
      this.setSrc(`http://localhost:${project.port}`);
    });

    match(Msg.Project.ProjectCloseNotification, () => {
      this.setSrc(null);
    });

    this.store.set("projects", this.projects.map(p => {
      return {
        id: p.model.id,
        url: p.model.url,
        path: p.model.path
      };
    }));
  }

  onDownMessage(message: any) {
    console.log('down', message);
  }

  @action addProject(url: string) {
    const previous = this.projects.find(p => p.model.url === url);

    if (previous) {
      previous.highlight();
      return;
    }

    const project = Project.from({
      url,
      path: Path.join(Os.homedir(), "patternplate")
    });

    this.up = merge(this.up, project.up);
    this.down = merge(this.down, project.down);

    this.up.subscribe(msg => this.onUpMessage(msg));
    this.down.subscribe(msg => this.onDownMessage(msg));

    this.projects.push(new ProjectViewModel(project));
    project.down.next(new Msg.Project.ProjectProcessRequest(project.id, project));
  }

  @action setInput(input: string) {
    this.input = input;
  }

  @action setSrc(src: string) {
    this.src = src;
  }
}
