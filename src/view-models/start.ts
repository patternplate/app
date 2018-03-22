import {Observable, Subject} from "rxjs";
import {merge} from 'rxjs/observable/merge';
import {action, observable, computed} from "mobx";
import {ProjectViewModel} from "./project";
import {ProjectUnprocessedMessage} from "../messages/project";
import {VCSRemoveResponse} from "../messages/vcs";
import {Project, ProjectState} from "../models/project";

const gitUrlParse = require("git-url-parse");

export interface StartViewModelInit {
  /* Initial value of the git url input */
  input?: string;
  /* Array of initially available patternplate projects */
  projects?: ProjectViewModel[];
}

export class StartViewModel {
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

  constructor(init?: StartViewModelInit) {
    if (init && init.hasOwnProperty("input")) {
      this.input = init.input;
    }

    if (init && init.hasOwnProperty("projects")) {
      this.projects = init.projects;
    }
  }

  onUpMessage(message: any) {
    if (message instanceof VCSRemoveResponse) {
      const index = this.projects.findIndex(p => p.model.id === message.id);
      if (index === -1) {
        return;
      }
      this.projects.splice(index, 1);
    }
  }

  onDownMessage(message: any) {
    console.log('down', message);
  }

  @action addProject(url: string) {
    const previous = this.projects.find(p => p.model.repository.url === url);

    if (previous) {
      previous.highlight();
      return;
    }

    const project = Project.fromUrl(url);

    this.up = merge(this.up, project.up);
    this.down = merge(this.down, project.down);

    this.up.subscribe(msg => this.onUpMessage(msg));
    this.down.subscribe(msg => this.onDownMessage(msg));

    this.projects.push(new ProjectViewModel(project));
    project.process();
  }

  @action setInput(input: string) {
    this.input = input;
  }
}
