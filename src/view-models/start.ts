import * as Os from "os";
import * as Path from "path";
import {Observable, Subject} from "rxjs";
import {merge} from 'rxjs/observable/merge';
import {action, observable, computed} from "mobx";
import * as Msg from "../messages";
import {ProjectViewModel} from "./project";
import {Project} from "../models/project";

const ARSON = require("arson");
const gitUrlParse = require("git-url-parse");

export class StartViewModelInit {
  input?: string;
  projects?: ProjectViewModel[];
  store: any;
}

export class StartViewModel {
  private store: any;
  private up: Observable<any> = new Subject();
  private down: Observable<any> = new Subject();

  /* Current value of the git url input */
  @observable input: string = "https://github.com/meetalva/designkit.git";

  /* Known patternplate projects */
  @observable projects: ProjectViewModel[] = [];

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

  static fromStore(store: any) {
    return new StartViewModel({
      input: store.get("input"),
      store
    });
  }

  constructor(init: StartViewModelInit) {
    this.store = init.store;

    if (init.hasOwnProperty("input") && typeof init.input === "string") {
      this.input = init.input;
    }

/*    if (init.hasOwnProperty("projects") && Array.isArray(init.projects)) {
      this.projects = init.projects;

      this.projects.forEach(project => {
        this.up = merge(this.up, project.model.up);
        this.down = merge(this.down, project.model.down);

        this.up.subscribe(msg => this.onUpMessage(msg));
        this.down.subscribe(msg => this.onDownMessage(msg));
      });
    } */
  }

  /* onUpMessage(message: any) {
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

    this.store.set("projects", this.projects.map(p => ARSON.stringify(p)));
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
      path: Path.join(Os.homedir(), "patternplate"),
      previous: null
    });

    this.up = merge(this.up, project.up);
    this.down = merge(this.down, project.down);

    this.up.subscribe(msg => this.onUpMessage(msg));
    this.down.subscribe(msg => this.onDownMessage(msg));

    this.projects.push(new ProjectViewModel(project));
    project.down.next(new Msg.Project.ProjectProcessRequest(project.id, project));
  } */

  @action setInput(input: string) {
    if (this.valid) {
      this.store.set("input", input);
    }
    this.input = input;
  }

  @action resetInput() {
    this.store.set("input", "");
    this.input = "";
  }
}
