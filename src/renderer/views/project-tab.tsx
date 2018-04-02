import * as React from "react";
import { ProjectViewModel } from "../view-models";
import * as Msg from "../../messages";

const { observer } = require("mobx-react");
const { Text, styled } = require("@patternplate/components");

export interface ProjectTabProps {
  active: boolean;
  project: ProjectViewModel;
  onClick: React.MouseEventHandler<HTMLElement>;
  onContextMenuRequest(
    message: Msg.UI.ContextMenuRequest,
    project: ProjectViewModel
  ): void;
}

@observer
export class ProjectTab extends React.Component<ProjectTabProps> {
  private ref: HTMLElement | null = null;

  componentDidMount() {
    this.props.project.down.subscribe(message => {
      const match = Msg.match(message);
      match(Msg.UI.ContextMenuRequest, () => {
        const { el } = message;

        if (this.ref === null) {
          return;
        }

        if (this.ref.contains(el)) {
          this.props.onContextMenuRequest(message, this.props.project);
        }
      });
    });
  }

  render() {
    const props = this.props;

    return (
      <StyledChromeTab
        active={props.active}
        title={`View Library ${props.project.name}`}
        key={props.project.id}
        onClick={props.onClick}
        innerRef={(ref: HTMLElement | null) => (this.ref = ref)}
      >
        <StyledChromeLabel>{props.project.name}</StyledChromeLabel>
        <StyledCloseIcon
          title={`Close Library ${props.project.name}`}
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.stopPropagation();
            props.project.stop();
          }}
        >
          <svg viewBox="0 0 30 30">
            <path d="M15 7h1v16h-1V7z" />
            <path d="M23 15v1H7v-1h16z" />
          </svg>
        </StyledCloseIcon>
      </StyledChromeTab>
    );
  }
}

const StyledChromeTab = styled.a`
  display: flex;
  align-items: center;
  height: 100%;
  max-width: 150px;
  overflow: hidden;
  font-size: 13px;
  box-sizing: border-box;
  cursor: pointer;
  padding: 10px;
  background: ${(props: any) =>
    props.active ? `rgb(26, 24, 68)` : "transparent"};
  color: ${(props: any) =>
    props.active ? props.theme.color : props.theme.recess};
  :hover {
    color: ${(props: any) => props.theme.color};
  }
`;

const StyledChromeLabel = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StyledCloseIcon = styled.a`
  flex: 0 0 20px;
  transform: rotate(45deg);
  width: 20px;
  height: 20px;
  fill: currentColor;
  border-radius: 50%;
  &:hover {
    background: #0f0f32;
  }
  margin-left: 5px;
`;
