import {Project} from "../models/project";

export class StartViewModel {
  private url: string = "";
  private projects: Project[];

  setUrl(value: string) {
    this.url = value;
  }

  getUrl() {
    return this.url;
  }

  addProject(url: string) {
    this.projects.push(Project.fromUrl(url));
  }
}
