import * as React from "react";
import {observer} from "mobx-react";
import * as uuid from "uuid";

import * as Msg from "../../messages";
import {ProjectViewModel} from "../view-models";

const { styled, Icon, Text } = require("@patternplate/components");
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
    this.props.project.down.subscribe((message: any) => {
      if (this.ref === null) {
        return;
      }

      const match = Msg.match(message);

      match(Msg.Project.ProjectUrlRequest, () => {
        const resp = new Msg.Project.ProjectUrlResponse(message.tid, this.ref.getURL());
        this.props.project.up.next(resp);
      });
    });

    if (this.ref !== null) {
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
        <Loader>
          Loading<br/>
          <b>{props.project.name}</b>
        </Loader>
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
  z-index: 2;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const Loader: React.SFC<{children: React.ReactNode}> = props => (
  <StyledLoader>
    <StyledLoaderContainer>
      <StyledIcon symbol="patternplate" size="l" />
      <StyledText>{props.children}</StyledText>
    </StyledLoaderContainer>
  </StyledLoader>
);

const StyledLoader = styled.div`
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgb(26, 24, 68);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledLoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const StyledIcon = styled(Icon)`
  height: 100px;
  width: 100px;
  color: ${(props: any) => props.theme.color};
`;

const StyledText = styled(Text)`
  color: ${(props: any) => props.theme.color};
  line-height: 1.5;
`;
