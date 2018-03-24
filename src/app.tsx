
import * as React from "react";

import { Start } from "./views/start";
import { StartViewModel } from "./view-models/start";

const { Observer, observer, inject } = require("mobx-react");
const { ThemeProvider, themes } = require("@patternplate/components");

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
        <Start
          value={props.start.input}
          valid={props.start.valid}
          src={props.start.src}
          projects={props.start.projects}
          onChange={(e: React.FormEvent<HTMLInputElement>) => {
            props.start.setInput((e.target as HTMLInputElement).value);
          }}
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            props.start.addProject(props.start.input);
          }}
          />
      </ThemeProvider>
    );
  }
}
