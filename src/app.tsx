
import * as React from "react";

import { Start } from "./views/start";
import { Projects } from "./views/projects";

import { StartViewModel } from "./view-models/start";

const { Observer, observer, inject } = require("mobx-react");
const { ThemeProvider, themes, styled } = require("@patternplate/components");

interface InjectedAppProps {
  start: StartViewModel;
}

@inject("start")
@observer
export class App extends React.Component {
  render() {
    const props = this.props as InjectedAppProps;

    return (
      <ThemeProvider theme={themes().dark}>
        <Tower>
          {
            props.start.projects.length === 0 &&
              <Start
                value={props.start.input}
                valid={props.start.valid}
                src={props.start.src}
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
                  props.start.addProject(props.start.input);
                }}
                />
          }
          {
            props.start.projects.length > 0 &&
              <Projects
                projects={props.start.projects}
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
