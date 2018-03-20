import * as React from "react";
import * as ReactDOM from "react-dom";
import {Provider} from "unstated";

import {App} from "./app";

async function main() {
  const el = document.querySelector("[data-mount]");
  ReactDOM.render(
    <Provider>
      <App/>
    </Provider>
  , el);
}

main()
  .catch(err => {
    console.error(err); // tslint:disable-line
  })

