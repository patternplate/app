import * as React from "react";
import * as ReactDOM from "react-dom";
import RedBox from "redbox-react";
import { Provider } from "mobx-react";
import * as uuid from "uuid";

import { App } from "./app";
import * as Msg from "../messages";
import { StartViewModel } from "./view-models/start";
import { ProjectViewCollection } from "./view-models/projects";

const electron = require("electron");
const Store = require("electron-store");
const { injectGlobal } = require("@patternplate/components");

async function main() {
  document.addEventListener("dragover", event => event.preventDefault());
  document.addEventListener("drop", event => event.preventDefault());

  const store = new Store();
  const window = electron.remote.getCurrentWindow();

  injectGlobal`
    html, body {
      height: 100%;
    }
    body {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      min-width: 500px;
      margin: 0;
      padding-top: 40px;
      background: #0F0F32;
    }
    [data-mount] {
      height: 100%;
    }
  `;

  const el = document.createElement("div");
  el.setAttribute("data.mount", "data-mount");
  document.body.appendChild(el);

  const start = StartViewModel.fromStore(store);
  const projects = ProjectViewCollection.fromStore(store);
  projects.items.map(item => item.analyse());

  window.webContents.on("context-menu", (e, props) => {
    const el = document.elementFromPoint(props.x, props.y);
    const tid = uuid.v4();

    projects.up.subscribe((message) => {
      const match = Msg.match(message);

      match(Msg.UI.ContextMenuResponse, () => {
        if (message.tid !== tid) {
          return;
        }

        const {project} = message;

        const items = [
          project.isReady() && {
            label: "Start",
            click: () => project.start()
          },
          project.isWorking() && project.managed && {
            label: "Abort",
            click: () => {}
          },
          !project.isWorking() && !project.inTransition() && {
            label: project.managed ? "Remove" : "Unlist",
            click: () => project.remove()
          },
          !project.inTransition() && !project.isWorking() && project.managed && {
            label: "Force sync",
            click: () => project.clone()
          },
        ].filter(Boolean);

        const menu = electron.remote.Menu.buildFromTemplate(items as any);

        menu.popup(window, {
          async: true
        });
      })
    });

    projects.broadcast(new Msg.UI.ContextMenuRequest(tid, el));
  });

  electron.ipcRenderer.on("menu-request-new", () => {
    projects.addEmptyProject();
  });

  electron.ipcRenderer.on("menu-request-open-from-fs", (_: any, path: string) => {
    projects.addProjectByPath(path);
  });

  if (process.env.NODE_ENV !== "production") {
    (global as any).start = start;
    (global as any).projects = projects;
  }

  try {
    ReactDOM.render(
      <Provider start={start} projects={projects}>
        <App />
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
