
import * as React from "react";

import { StartView } from "./views/start";
import { ProjectsView } from "./views/projects";

import { StartViewModel } from "./view-models/start";
import { ProjectViewCollection } from "./view-models/projects";

const { Observer, observer, inject } = require("mobx-react");
const { ThemeProvider, themes, styled } = require("@patternplate/components");

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
        <Tower>
          {
            props.projects.length === 0 &&
              <StartView
                value={props.start.input}
                valid={props.start.valid}
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
                  const project = props.projects.addProjectByUrl(props.start.input);
                  project.clone();
                  props.start.resetInput();
                }}
                />
          }
          {
            props.projects.length > 0 &&
              <ProjectsView
                projects={props.projects}
                onAddClick={() => {
                  props.projects.addEmptyProject();
                }}
                />
          }
        </Tower>
      </ThemeProvider>
    );
  }
}

const Tower = styled.div`
  width: 100%;
  max-width: 600px;
  padding: 20px;
  box-sizing: border-box;
  margin: 0 auto;
  height: 100%;
`;
