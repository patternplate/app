import {Project} from "../models/project";

export interface StartViewModelInit {
  /* Initial value of the git url input */
  url?: string;
  /* Array of initially available patternplate projects */
  projects?: Project[];
}

export class StartViewModel {
  /* Current value of the git url input */
  private url: string = "";
  /* Known patternplate projects */
  private projects: Project[] = [];

  constructor(init?: StartViewModelInit) {
    if (typeof init !== "object") {
      return;
    }

    if (init.hasOwnProperty("url")) {
      this.url = init.url;
    }

    if (init.hasOwnProperty("projects")) {
      this.projects = init.projects;
    }
  }

  /** Set the git url used to fetch a new project */
  setUrl(value: string) {
    this.url = value;
  }

  /** Get the current value of git fetch url */
  getUrl() {
    return this.url;
  }

  /** Add a new project from a git fetch url */
  addProject(url: string) {
    if (url.length === 0) {
      return;
    }

    this.projects.push(Project.fromUrl(url));
  }

  /** Check wether the the current url value is valid */
  hasValidUrl(): boolean {
    return this.getUrl().length > 0;
  }
}
