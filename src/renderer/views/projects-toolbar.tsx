import * as React from "react";
import { observer } from "mobx-react";

const { Icon, styled } = require("@patternplate/components");

export interface ProjectsToolbarProps {
  onNewClick: React.MouseEventHandler<HTMLElement>;
  onAddClick: React.MouseEventHandler<HTMLElement>;
}

export const ProjectsToolbar = observer((props: ProjectsToolbarProps) => (
  <StyledProjectsToolbar>
    <StyledTool onClick={props.onNewClick} title="New library (CMD+N)">
      <svg width="35" height="35" viewBox="0 0 30 30" style={{fill: "currentColor"}}>
        <path d="M15 7h1v16h-1V7z"/>
        <path d="M23 15v1H7v-1h16z"/>
      </svg>
    </StyledTool>
    <StyledTool onClick={props.onAddClick} title="Open library (CMD+O)">
      <Icon symbol="folder" size="m"/>
    </StyledTool>
  </StyledProjectsToolbar>
));

const StyledProjectsToolbar = styled.nav`
  position: fixed;
  z-index: 1;
  top: 40px;
  display: flex;
  width: 100%;
  height: 40px;
  background: rgb(26, 24, 68);
`;

const StyledTool = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 40px;
  box-sizing: border-box;
  padding: 5px;
  color: ${(props: any) => props.active ? props.theme.color : props.theme.recess};
  cursor: pointer;
  &:hover {
    color: ${(props: any) => props.theme.color};
  }
`;
