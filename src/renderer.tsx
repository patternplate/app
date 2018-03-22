import * as React from "react";
import * as ReactDOM from "react-dom";
import RedBox from "redbox-react";
import { observable, decorate } from "mobx";
import { Provider } from "mobx-react";

import { App } from "./app";
import { StartViewModel } from "./view-models/start";


async function main() {
  const el = document.querySelector("[data-mount]");
  const start = new StartViewModel();

  try {
    ReactDOM.render(
      <Provider start={start}>
        <App/>
      </Provider>
    , el);
  } catch (error) {
    ReactDOM.render(<RedBox error={error}/>, el);
  }
}

main()
  .catch(err => {
    console.error(err); // tslint:disable-line
  })

