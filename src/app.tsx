
import * as React from "react";

import {Start} from "./views/start";
import {StartViewModel} from "./view-models/start";

const {ThemeProvider, themes} = require("@patternplate/components");

export class App extends React.Component {
  render() {
    return (
      <ThemeProvider theme={themes().dark}>
        <Start/>
      </ThemeProvider>
    );
  }
}
