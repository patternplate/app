
import * as React from "react";
import { Container, Subscribe } from "unstated";

import {Logo} from "./logo";

interface IAppState {
  project: string;
}

class AppContainer extends Container<IAppState> {

}

export function App() {
  return (
    <Subscribe to={[AppContainer]}>
      {
        app => (
          <React.Fragment>
            <Logo />
          </React.Fragment>
        )
      }
    </Subscribe>
  );
}
