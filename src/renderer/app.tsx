import * as React from "react";

import * as Msg from "../messages";
import { StartView } from "./views/start";
import { ProjectsView } from "./views/projects";
import { WebView } from "./views/webview";
import { ProjectTab } from "./views/project-tab";

import { AppViewModel, ProjectViewCollection, StartViewModel } from "./view-models";

const { observer, inject } = require("mobx-react");
const {
  Icon,
  ThemeProvider,
  themes,
  styled
} = require("@patternplate/components");

const electron = require("electron");

interface InjectedAppProps {
  app: AppViewModel;
  start: StartViewModel;
  projects: ProjectViewCollection;
  paths: {
    userData: string;
  }
}

@inject("start", "projects", "paths", "app")
@observer
export class App extends React.Component {
  render() {
    const props = this.props as InjectedAppProps;
    const hasActiveProject = props.projects.startedProjects.some(
      p => p.id === props.projects.activeProject
    );

    return (
      <ThemeProvider theme={themes().dark}>
        <React.Fragment>
          <Chrome>
            <StyledChromeTab
              title="View Library List"
              active={!hasActiveProject}
              onClick={() => props.projects.setActiveProject(null)}
            >
              <Icon size="m" symbol="patternplate" />
            </StyledChromeTab>
            {props.projects.startedProjects.map(project => (
              <ProjectTab
                key={project.id}
                active={props.projects.activeProject === project.id}
                project={project}
                onClick={() => props.projects.setActiveProject(project.id)}
                onContextMenuRequest={message => {
                  project.up.next(
                    new Msg.UI.ContextMenuResponse(message.tid, project)
                  );
                }}
              />
            ))}
          </Chrome>
          {props.projects.length === 0 && (
            <StartView
              value={props.start.input}
              valid={props.start.valid}
              onNewClick={() => props.projects.addEmptyProject({ autoStart: true, basePath: props.paths.userData })}
              onAddClick={() => electron.ipcRenderer.send("open-from-fs")}
              onLinkClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                const target = e.target as HTMLAnchorElement;
                const href = target.getAttribute("href") || "";
                props.start.setInput(href);
              }}
              onChange={(e: React.FormEvent<HTMLInputElement>) => {
                props.start.setInput((e.target as HTMLInputElement).value);
              }}
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const project = props.projects.addProjectByUrl(
                  props.start.input,
                  { autoStart: true, basePath: props.paths.userData }
                );

                if (project) {
                  project.clone();
                  props.start.resetInput();
                }
              }}
            />
          )}
          {props.projects.length > 0 && (
            <ProjectsView
              projects={props.projects}
              onEscape={() => {
                props.projects.items
                  .filter(p => p.editable)
                  .forEach(p => p.discard());
              }}
              onNewClick={() => props.projects.addEmptyProject({
                basePath: props.paths.userData,
                autoStart: true
              })}
              onAddClick={() => electron.ipcRenderer.send("open-from-fs")}
            />
          )}
          {props.projects.startedProjects.map(project => (
            <WebView
              key={project.id}
              port={project.port}
              project={project}
              active={project.id === props.projects.activeProject}
            />
          ))}
        </React.Fragment>
      </ThemeProvider>
    );
  }
}

interface ChromeProps {
  children: React.ReactNode;
}

const Chrome = (props: ChromeProps) => {
  return (
    <StyledChrome>
      <StyledTrafficLightSpacer />
      {props.children}
    </StyledChrome>
  );
};

const StyledChrome = styled.header`
  box-sizing: border-box;
  position: fixed;
  z-index: 10;
  display: flex;
  top: 0;
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  -webkit-app-region: drag;
  -webkit-user-select: none;
  user-select: none;
  background: #0f0f32;
`;

const StyledChromeTab = styled.a`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  height: 100%;
  max-width: 150px;
  overflow: hidden;
  font-size: 13px;
  box-sizing: border-box;
  cursor: pointer;
  padding: 10px;
  background: ${(props: any) =>
    props.active ? `rgb(26, 24, 68)` : "transparent"};
  color: ${(props: any) =>
    props.active ? props.theme.color : props.theme.recess};
  :hover {
    color: ${(props: any) => props.theme.color};
  }
`;

const StyledTrafficLightSpacer = styled.div`
  flex: 0 0 80px;
  width: 80px;
  height: 40px;
`;
