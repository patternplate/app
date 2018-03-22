import * as React from "react";
import * as ReactDOM from "react-dom";
import RedBox from "redbox-react";

import {App} from "./app";

async function main() {
  const el = document.querySelector("[data-mount]");
  try {
    ReactDOM.render(<App/>, el);
  } catch (error) {
    ReactDOM.render(<RedBox error={error}/>, el);
  }
}

main()
  .catch(err => {
    console.error(err); // tslint:disable-line
  })

