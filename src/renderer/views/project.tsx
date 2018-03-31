import * as React from "react";
import {observer} from "mobx-react";
import * as Msg from "../../messages";
import {ProjectViewModel, ProjectViewState} from "../view-models";

const { keyframes, styled, Icon, Text } = require("@patternplate/components");
const { Animated } = require("react-web-animation");

export interface ProjectViewProps {
  project: ProjectViewModel;
}

@observer
export class ProjectView extends React.Component<ProjectViewProps> {
  private ref: HTMLFormElement | null = null;

  componentDidMount() {
    this.props.project.down.subscribe(message => {
      const match = Msg.match(message);

      match(Msg.UI.ContextMenuRequest, () => {
        const {el} = message;

        if (this.ref === null) {
          return;
        }

        if (this.ref.contains(el)) {
          this.props.project.up.next(new Msg.UI.ContextMenuResponse(message.tid, this.props.project));
        }
      })
    });
  }

  render() {
    const {props} = this;

    return (
      <form
        ref={(ref) => this.ref = ref}
        key={props.project.id}
        onSubmit={(e: any) => {
          e.preventDefault();
          if (props.project.editable) {
            return props.project.save();
          }
          if (props.project.isReady()) {
            return props.project.start();
          }
        }}
        onReset={(e: any) => {
          e.preventDefault();
          if (props.project.editable) {
            return props.project.discard();
          }
          props.project.remove();
        }}
      >
        <ProjectTile
          playState={props.project.highlighted ? "running" : "idle"}
          timing={{ duration: 300, iterations: 2 }}
          keyframes={WIGGLE}
        >
          <ProjectIcon
            icon={props.project.logo}
            loading={props.project.isWorking()}
            label={getPhase(props.project.state)}
          />
          <ProjectProperties>
            <ProjectName
              onChange={(e: any) => props.project.setInputName(e.target.value)}
              readOnly={props.project.editable !== true}
              value={props.project.inputName || props.project.name || ""}
            />
            <ProjectUrl
              onChange={(e: any) => props.project.setInputUrl(e.target.value)}
              readOnly={props.project.editable !== true}
              value={props.project.inputUrl || props.project.url || ""}
            />
          </ProjectProperties>
          {props.project.editable && (
            <ProjectActions>
              <ProjectAction actionType="negative" type="reset">
                <Text>Discard</Text>
              </ProjectAction>
              <ProjectAction actionType="affirmative" type="submit">
                <Text>Save</Text>
              </ProjectAction>
            </ProjectActions>
          )}
          {props.project.isWorking() && (
            <ProjectActions>
              <ProjectAction actionType="negative" type="reset">
                <Text>Abort</Text>
              </ProjectAction>
            </ProjectActions>
          )}
          {props.project.isReady() &&
            !props.project.editable && (
              <PrimaryProjectActions>
                <PrimaryProjectAction
                  actionType="affirmative"
                  order="primary"
                  type="submit"
                >
                  <Text>Start</Text>
                </PrimaryProjectAction>
              </PrimaryProjectActions>
            )}
        </ProjectTile>
      </form>
    );
  }
}

const WIGGLE = [
  {
    transform: "rotate(0deg)"
  },
  {
    transform: "rotate(2deg)",
    offet: 0.25
  },
  {
    transform: "rotate(-2deg)",
    offset: 0.75
  },
  {
    transform: "rotate(0deg)"
  },
];

const getPhase = (state: ProjectViewState): string => {
    switch(state) {
      case ProjectViewState.Fetching:
        return "Fetching";
      case ProjectViewState.Installing:
        return "Installing";
      case ProjectViewState.Building:
        return "Building";
      case ProjectViewState.Starting:
      case ProjectViewState.Opening:
        return "Starting";
      case ProjectViewState.Removing:
        return "Removing";
      default:
        return "";
    }
}

const ProjectProperties = styled.div`
  flex: 1 1 100%;
  overflow: hidden;
`;

interface ProjectIconProps {
  loading: boolean;
  label: string;
  icon: string;
}

const ProjectIcon = (props: ProjectIconProps) => (
  <StyledProjectIcon>
    <StyledIconContainer>
      {
        props.icon
          ? <div dangerouslySetInnerHTML={{__html: props.icon}}/>
          : <StyledDefaultIcon/>
      }
    </StyledIconContainer>
    <StyledIconText><span>{props.label}</span></StyledIconText>
    <IconCircumfence loading={props.loading}>
      <circle cx="50" cy="50" r="49"/>
    </IconCircumfence>
  </StyledProjectIcon>
);

const CIRCUM_FENCE = 2 * Math.PI * 50;
const SPIN = keyframes`
  from {
    transform: rotate(-90deg);
  }
  50% {
    transform: rotate(90deg)
  }
  100% {
    transform: rotate(270deg);
  }
`;

const StyledIconContainer = styled.div`
  position: absolute;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledDefaultIcon = styled(Icon).attrs({ symbol: "patternplate" })`
  width: 60px;
  height: 60px;
`;

const StyledIconText = styled(Text)`
  position: relative;

  > span {
    position: relative;
    z-index: 2;
  }

  &::before {
    content: '';
    position: absolute;
    z-index: 1;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(255, 255, 255, 1);
    transform: scale(1.5);
    transform-origin: center;
    filter: blur(3px);
  }
`;

const IconCircumfence = styled.svg.attrs({ viewBox: "0 0 100 100" })`
  position: absolute;
  width: 90px;
  height: 90px;
  circle {
    fill: transparent;
    stroke-width: ${(props: any) => props.loading ? 1: 0};
    stroke: black;
    stroke-dasharray: ${CIRCUM_FENCE};
    stroke-dashoffset: -339;
    transform: rotate(-90deg);
    transform-origin: center;
    animation: ${SPIN} .5s infinite linear;
    animation-play-state: ${(props: any) => props.loading ? "running": "paused"};
  }
`;

const StyledProjectIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 90px;
  height: 90px;
  width: 90px;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
  margin-right: 15px;
  overflow: hidden;
  font-size: 13px;
  color: #999;
`;

const PrimaryProjectActions = styled.div`
  display: flex;
  align-items: center;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding: 20px 0 20px 45px;
  margin-right: 10px;
  background-image: linear-gradient(
    to right,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 1) 20%
  );
`;

const PrimaryProjectAction = styled.button`
  padding: 3px 7px;
  background: ${(props: any) => props.actionType === "negative" ? props.theme.error : props.theme.active};
  border: none;
  border-radius: 2px;
  text-align: left;
  cursor: pointer;
  color: #fff;
  &:not(:last-child) {
    margin-right: 10px;
  }
  &:focus {
    outline: none;
  }
`;

const ProjectAction = styled.button`
  background: none;
  border: none;
  border-radius: none;
  text-align: left;
  cursor: pointer;
  color: ${(props: any) => props.actionType === "negative" ? props.theme.error : props.theme.active};
  &:hover {
    text-decoration: underline;
    text-decoration-style: dotted;
  }
  &:not(:last-child) {
    margin-right: 10px;
  }
  &:focus {
    outline: none;
  }
`;

const ProjectActions = styled.div`
  opacity: 0;
  pointer-events: none;
  display: flex;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding: 20px 0 20px 45px;
  margin-right: 10px;
  background-image: linear-gradient(
    to right,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 1) 20%
  );
`;

const ProjectTile = styled(Animated.div)`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border: 1px solid #979797;
  border-radius: 6px;
  padding: 15px;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  margin-bottom: 15px;
  &:hover ${ProjectActions} {
    opacity: 1;
    pointer-events: initial;
  }
`;

interface ProjectPropertyProps {
  autoFocus: boolean;
  value: string;
  name: string;
  className?: string;
  placeholder: string;
  readOnly: boolean;
  full?: boolean;
  signify: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const ProjectProperty: React.SFC<ProjectPropertyProps> = props => {
  return (
    <StyledPropertyInput
      autoFocus={props.autoFocus}
      className={props.className}
      value={props.value}
      name={props.name}
      placeholder={props.placeholder}
      full={props.full}
      readOnly={props.readOnly}
      signify={props.signify}
      onChange={props.onChange}
      />
  );
};

interface ProjectNameProps {
  value: string;
  readOnly: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const ProjectName: React.SFC<ProjectNameProps> = props => {
  return (
    <StyledPropertyProjectName
      placeholder="Name"
      readOnly={props.readOnly}
      full
      signify={false}
      value={props.value}
      onChange={props.onChange}
      />
  )
};

const StyledPropertyProjectName = styled(ProjectProperty).attrs({name: "name"})`
  color: #0F0F32;
  font-size: 20px;
`;

const ProjectUrl: React.SFC<ProjectNameProps> = props => {
  return (
    <StyledPropertyProjectUrl
      full
      autoFocus
      placeholder="GIT URL"
      readOnly={props.readOnly}
      signify={false}
      onChange={props.onChange}
      value={props.value}
      />
  )
};

const StyledPropertyProjectUrl = styled(ProjectProperty).attrs({name: "url"})`
  color: #999;
  font-size: 13px;
`;

const StyledPropertyInput = styled.input`
  display: block;
  padding: ${(props: any) => props.readOnly ? 0 : 8}px 15px;
  border: ${(props: any) => props.readOnly || !props.signify ? "1.5px dashed transparent" : "1.5px dashed #999"};
  border-radius: 6px;
  box-sizing: border-box;
  width: ${(props: any) => props.full ? "100%": "auto"};
  text-overflow: ellipsis;
  user-select: ${(props: any) => props.readOnly ? "none" : "auto"};
  &:focus {
    outline: none;
    border: ${(props: any) => props.readOnly ? "1.5px dashed transparent" : "1.5px dashed #999"};
  }
`;
