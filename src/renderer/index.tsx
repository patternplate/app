import * as React from "react";
import * as ReactDOM from "react-dom";
import RedBox from "redbox-react";
import { Provider } from "mobx-react";

import { App } from "./app";
import { StartViewModel } from "./view-models/start";
import { ProjectViewCollection } from "./view-models/projects";

const Store = require("electron-store");
const { injectGlobal } = require("@patternplate/components");

async function main() {
  const store = new Store();

  injectGlobal`
    html, body {
      height: 100%;
    }
    body {
      width: 100%;
      min-width: 500px;
      margin: 0;
      background: #0F0F32;
    }
    [data-mount] {
      height: 100%;
    }
  `

  const el = document.createElement("div");
  el.setAttribute("data.mount", "data-mount");
  document.body.appendChild(el);

  const start = StartViewModel.fromStore(store);
  const projects = ProjectViewCollection.fromStore(store);
  projects.items.map(item => item.analyse());

  try {
    ReactDOM.render(
      <Provider start={start} projects={projects}>
        <App/>
      </Provider>
    , el);
  } catch (error) {
    ReactDOM.render(<RedBox error={error}/>, el);
  }

  if (module.hot) {
    module.hot.accept("./app", () => {
      const NextApp = require("./app").App;
      ReactDOM.render(
        <Provider start={start} projects={projects}>
         <NextApp/>
        </Provider>
      , el)
    });
  }
}

main()
  .catch(err => {
    console.error(err); // tslint:disable-line
  })
