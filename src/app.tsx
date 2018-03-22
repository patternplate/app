
import * as React from "react";

import {Start} from "./views/start";
import {StartViewModel} from "./view-models/start";

const {ThemeProvider, themes} = require("@patternplate/components");

export class App extends React.Component {
  state = { start: new StartViewModel() };

  render() {
    const {start} = this.state;

    return (
      <ThemeProvider theme={themes().dark}>
        <Start
          onChange={(e) => start.setUrl((e.target as HTMLInputElement).value)}
          onSubmit={(e) => {
            e.preventDefault();
            start.addProject(start.getUrl())
          }}
          value={start.getUrl()}
          />
      </ThemeProvider>
    );
  }
}
