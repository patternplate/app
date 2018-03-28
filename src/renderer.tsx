import * as React from "react";
import * as ReactDOM from "react-dom";
import RedBox from "redbox-react";
import { observable, decorate } from "mobx";
import { Provider } from "mobx-react";

import { App } from "./app";
import { StartViewModel } from "./view-models/start";
import { ProjectViewCollection } from "./view-models/projects";

const Store = require("electron-store");

async function main() {
  const store = new Store();
  const el = document.querySelector("[data-mount]");

  const start = StartViewModel.fromStore(store);
  const projects = ProjectViewCollection.fromStore(store);

  try {
    ReactDOM.render(
      <Provider start={start} projects={projects}>
        <App/>
      </Provider>
    , el);
  } catch (error) {
    ReactDOM.render(<RedBox error={error}/>, el);
  }
}

main()
  .catch(err => {
    console.error(err); // tslint:disable-line
  })

