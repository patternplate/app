
import * as React from "react";

import { StartView } from "./views/start";
import { ProjectsView } from "./views/projects";

import { StartViewModel } from "./view-models/start";
import { ProjectViewCollection } from "./view-models/projects";

const { observer, inject } = require("mobx-react");
const { Icon, Text, ThemeProvider, themes, styled } = require("@patternplate/components");

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
          <Chrome/>
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
                    const project = props.projects.addProjectByUrl(props.start.input, {autoStart: true});

                    if (project) {
                      project.clone();
                      props.start.resetInput();
                    }
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
        </React.Fragment>
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

const Chrome = () => {
  return (
    <StyledChrome>
      <StyledChromeText>
        <StyledChromeIcon symbol="patternplate"/>
        patternplate
      </StyledChromeText>
    </StyledChrome>
  );
};

const StyledChrome = styled.header`
  box-sizing: border-box;
  position: fixed;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  -webkit-app-region: drag;
  -webkit-user-select: none;
  user-select: none;
  background: #0F0F32;
`;

const StyledChromeText = styled(Text)`
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #999;
`;

const StyledChromeIcon = styled(Icon)`
  margin-right: .33em;
`;
