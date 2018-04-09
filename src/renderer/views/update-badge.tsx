import * as React from "react";
import { observer, inject } from "mobx-react";

const { styled, Text } = require("@patternplate/components");

import { AppViewModel, AppUpdatesState } from "../view-models"

export interface InjectedUpdateBadgeProps {
  app: AppViewModel;
}

@inject("app")
@observer
export class UpdateBadge extends React.Component {
  render() {
    const props = (this.props as InjectedUpdateBadgeProps);
    const {app} = props;

    return (
      <StyledBadge
        onClick={() => {
          if (app.updateState === AppUpdatesState.Unknown) {
            app.checkForUpdate();
          }
        }}
        cursor={selectCursor(app.updateState)}
        recess={app.updateState === AppUpdatesState.Unknown}
        active={app.updateState === AppUpdatesState.Available}>
        <StyledBadgeText>
          {getBadge(props.app.updateState)}
        </StyledBadgeText>
      </StyledBadge>
    );
  }
}

const selectCursor = (state: AppUpdatesState) => {
  switch (state) {
    case AppUpdatesState.Downloading:
    case AppUpdatesState.Checking:
      return "waiting";
    case AppUpdatesState.Unknown:
      return "pointer";
  }

  return "default";
}

const getBadge = (state: AppUpdatesState) => {
  switch (state) {
    case AppUpdatesState.Unknown:
      return "Check for update";
    case AppUpdatesState.Checking:
      return "Checking for update";
    case AppUpdatesState.Available:
      return "Download update";
    case AppUpdatesState.Unavailable:
      return "No update available";
  }

  return "";
}

const StyledBadge = styled.button`
  font-size: 13px;
  padding: 5px 15px;
  color: ${(props: any) => props.recess ? props.theme.recess : props.theme.color};
  background: ${(props: any) => props.active ? "#b3009b" : "transparent"};
  user-select: none;
  border-radius: 0 0 1.5px 1.5px;
  border: none;
  cursor: pointer;
  opacity: ${(props: any) => props.recess ? 0.5 : 1};
  &:hover {
    opacity: 1;
    color: ${(props: any) => props.theme.color};
    cursor: ${(props: any) => props.cursor};
    background: ${(props: any) => props.active ? "#80006e" : "transparent"};
  }
  &:focus {
    outline: none;
  }
`;

const StyledBadgeText = styled(Text)`
  font-size: 13px;
`;
