import {action, observable, computed} from "mobx";
import {ProjectViewModel} from "./project";

const gitUrlParse = require("git-url-parse");

export class StartViewModelInit {
  input?: string;
  projects?: ProjectViewModel[];
  store: any;
}

export class StartViewModel {
  private store: any;

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

    return false;
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
  }

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
