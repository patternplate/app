import * as React from "react";

import { StartView } from "./views/start";
import { ProjectsView } from "./views/projects";
import { WebView } from "./views/webview";

import {
  ProjectViewCollection,
  StartViewModel
} from "./view-models";

const { observer, inject } = require("mobx-react");
const {
  Icon,
  Text,
  ThemeProvider,
  themes,
  styled
} = require("@patternplate/components");

const electron = require("electron");

interface InjectedAppProps {
  start: StartViewModel;
  projects: ProjectViewCollection;
}

@inject("start", "projects")
@observer
export class App extends React.Component {
  render() {
    const props = this.props as InjectedAppProps;

    return (
      <ThemeProvider theme={themes().dark}>
        <React.Fragment>
          <Chrome>
            <StyledChromeTab
              title="View Library List"
              active={!props.projects.activeProject}
              onClick={() => props.projects.setActiveProject(null)}
            >
              <Icon size="m" symbol="patternplate" />
            </StyledChromeTab>
            {props.projects.startedProjects.map(project => (
              <StyledChromeTab
                active={props.projects.activeProject === project.id}
                title={`View Library ${project.name}`}
                key={project.id}
                onClick={() => props.projects.setActiveProject(project.id)}
              >
                <StyledChromeLabel>{project.name}</StyledChromeLabel>
              </StyledChromeTab>
            ))}
          </Chrome>
          {props.projects.length === 0 && (
            <StartView
              value={props.start.input}
              valid={props.start.valid}
              onNewClick={() => props.projects.addEmptyProject()}
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
                  { autoStart: true }
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
              onNewClick={() => props.projects.addEmptyProject()}
              onAddClick={() => electron.ipcRenderer.send("open-from-fs")}
            />
          )}
          {
            props.projects.startedProjects
              .map(project => (
                <WebView
                  key={project.id}
                  port={project.port}
                  project={project}
                  active={project.id === props.projects.activeProject}
                  />
              ))
          }
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

const StyledChromeLabel = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StyledTrafficLightSpacer = styled.div`
  flex: 0 0 80;
  width: 80px;
  height: 40px;
`;
