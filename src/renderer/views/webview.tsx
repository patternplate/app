import * as React from "react";
import {observer} from "mobx-react";
import * as uuid from "uuid";

import * as Msg from "../../messages";
import {ProjectViewModel} from "../view-models";

const { styled } = require("@patternplate/components");
const electron = require("electron");

export interface WebViewProps {
  active: boolean;
  port: number;
  project: ProjectViewModel;
}

@observer
export class WebView extends React.Component<WebViewProps> {
  ref?: any;

  componentDidMount() {
    if (this.ref) {
      const tid = uuid.v4();
      this.props.project.up.next(new Msg.Project.ProjectOpenNotification(tid, this.props.project.id));

      this.ref.addEventListener("did-finish-load", () => {
        this.props.project.up.next(new Msg.Project.ProjectOpenedNotification(tid));
      });

      this.ref.addEventListener("new-window", (e: any) => {
        electron.shell.openExternal(e.url);
      });
    }
  }

  render() {
    const {props} = this;
    return (
      <StyledWebviewContainer loaded={props.active}>
        <StyledWebview
          innerRef={(ref: any) => this.ref = ref}
          src={`http://localhost:${props.project.port}`}
          />
      </StyledWebviewContainer>
    )
  }
}

const StyledWebviewContainer = styled.div`
  position: fixed;
  z-index: 9;
  top: 40px;
  left: 0;
  right: 0;
  bottom: 0;
  transform: ${(props: any) => props.loaded ? `translateY(0)` : `translateY(100%)`};
  background: #0F0F32;
`;

const StyledWebview = styled("webview")`
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;
