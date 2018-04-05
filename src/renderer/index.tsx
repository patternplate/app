import * as Url from "url";
import * as Path from "path";
import * as React from "react";
import * as ReactDOM from "react-dom";
import RedBox from "redbox-react";
import { Provider } from "mobx-react";
import * as uuid from "uuid";

import { App } from "./app";
import * as Msg from "../messages";
import config from "../config";

import {
  ProjectViewModel,
  StartViewModel,
  ProjectViewCollection
} from "./view-models";

const electron = require("electron");
const Store = require("electron-store");
const { injectGlobal } = require("@patternplate/components");
const getPort = require("get-port");
const express = require("express");
const { OAuth2Provider } = require("electron-oauth-helper");

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

  const userData = electron.remote.app.getPath("userData");

  const port = await getPort();
  const server = express();
  server.use(express.static(Path.join(userData, "screenshots")));
  server.listen(port, () => {});

  const start = StartViewModel.fromStore(store);
  const projects = ProjectViewCollection.fromStore(store, {
    autoStart: false,
    basePath: userData
  });

  projects.items.map(item => item.analyse());

  window.webContents.on("context-menu", (e, props) => {
    const el = document.elementFromPoint(props.x, props.y);
    const tid = uuid.v4();
    projects.broadcast(new Msg.UI.ContextMenuRequest(tid, el));
  });

  projects.up.subscribe(message => {
    const match = Msg.match(message);

    match(Msg.UI.ContextMenuResponse, () => {
      const project: ProjectViewModel = message.project;
      const items = selectItems(project, {userData});
      const menu = electron.remote.Menu.buildFromTemplate(items as any);

      menu.popup(window, {
        async: true
      });
    });

    match(Msg.VCS.VCSCredentialChallenge, () => {
      const parsed = Url.parse(message.url);

      requestOAuthToken(message.url)
        .then(response => {
          projects.broadcast(new Msg.VCS.VCSCredentialAnswer(message.tid, {
            host: parsed.host as string,
            token: response.access_token
          }))
        })
        .catch(err => {
          console.log(err);
        });
    });
  });

  electron.ipcRenderer.on("menu-request-new", () => {
    projects.addEmptyProject({
      basePath: userData,
      autoStart: false
    });
  });

  electron.ipcRenderer.on(
    "menu-request-open-from-fs",
    (_: any, path: string) => {
      projects.addProjectByPath(path, {
        basePath: userData,
        autoStart: false
      });
    }
  );

  if (process.env.NODE_ENV !== "production") {
    (global as any).start = start;
    (global as any).projects = projects;
  }

  try {
    ReactDOM.render(
      <Provider start={start} projects={projects} paths={{userData}} port={port}>
        <App />
      </Provider>,
      el
    );
  } catch (error) {
    ReactDOM.render(<RedBox error={error} />, el);
  }

  if (module.hot) {
    module.hot.accept("./app", () => {
      const NextApp = require("./app").App;
      ReactDOM.render(
        <Provider start={start} projects={projects} paths={{userData}} port={port}>
          <NextApp />
        </Provider>,
        el
      );
    });
  }
}

main().catch(err => {
  console.error(err); // tslint:disable-line
});

interface OAuthResponse {
  access_token: string;
  state: string;
  token_type: "bearer";
}

function requestOAuthToken(url: string): Promise<OAuthResponse> {
  const win = new electron.remote.BrowserWindow({
    width: 0,
    height: 0,
    title: `Login for ${url}`,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const parsed = Url.parse(url);
  const hostConfig = config.oauth.find(h => h.hostname == parsed.hostname);

  if (!hostConfig) {
    return Promise.reject(new Error(`Could not authenticate at ${parsed.hostname} via https, please use SSH instead.`));
  }

  const state = uuid.v4();

  const provider = new OAuth2Provider({
    authorize_url: hostConfig.authorize,
    response_type: "token",
    client_id: hostConfig.clientId,
    redirect_uri: "http://app.authorized.patternplate",
    state
  });

  const showTimeout = setTimeout(() => {
    win.setSize(600, 400);
    win.show();
  }, 2000);

  return provider
    .perform(win)
    .then((response: OAuthResponse) => {
      if (response.state !== state) {
        return Promise.reject(new Error(`Authentication at ${parsed.hostname}, states did not match.`));
      }

      clearTimeout(showTimeout);
      win.close();
      return response;
    })
    .catch((err: Error) => {
      clearTimeout(showTimeout);
      win.close();
      return err;
    });
}

const selectItems = (project: ProjectViewModel, paths: {userData: string}): any[] => {
  if (project.editable) {
    return [
      {
        label: "Save",
        click: () => project.save({
          basePath: paths.userData,
          autoStart: true
        })
      },
      {
        label: "Discard",
        click: () => project.discard()
      }
    ];
  }

  return [
    project.isReady() &&
      !project.isStarted() &&
      !project.editable && {
        label: "Start",
        click: () => project.start({ open: false })
      },
    project.isStarted() &&
      !project.editable && {
        label: "Open",
        click: () => project.open()
      },
    project.isStarted() &&
      !project.editable && {
        label: "Stop",
        click: () => project.stop()
      },
    project.isWorking() && {
        label: "Abort",
        click: () => {}
      },
    {
      type: "separator"
    },
    !project.isWorking() &&
      !project.inTransition() && {
        label: "Remove",
        click: () => project.remove()
      },
    !project.inTransition() &&
      !project.isWorking() && {
        label: "Sync",
        click: () => project.sync()
      },
    {
      type: "separator"
    },
    {
      label: "Reveal in Finder",
      click: () => electron.remote.shell.openItem(project.path)
    },
    {
      label: "Copy Path",
      click: () => electron.clipboard.writeText(project.path)
    },
    {
      label: "Copy Git",
      click: () => electron.clipboard.writeText(project.url)
    }
  ].filter(Boolean);
};
