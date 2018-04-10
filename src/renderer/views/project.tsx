import * as React from "react";
import { inject, observer } from "mobx-react";
import * as uuid from "uuid";
import * as Msg from "../../messages";
import * as svg from "../util/svg";

import { ProjectViewModel, ProjectViewState } from "../view-models";

const { keyframes, styled, Icon } = require("@patternplate/components");
const { Animated } = require("@marionebl/react-web-animation");
const tag = require("tag-hoc").default;

export interface ProjectViewProps {
  project: ProjectViewModel;
  onDoubleClick: React.MouseEventHandler<HTMLElement>;
  port?: number;
  paths?: {
    userData: string;
    projects: string;
  }
}

interface InjectedProjectViewProps {
  project: ProjectViewModel;
  onDoubleClick: React.MouseEventHandler<HTMLElement>;
  port: number;
  paths: {
    userData: string;
    projects: string;
  }
}

@inject("paths", "port")
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
    const props = (this.props as InjectedProjectViewProps);

    return (
      <form
        ref={(ref) => this.ref = ref}
        key={props.project.id}
        onSubmit={(e: any) => {
          e.preventDefault();
          if (props.project.editable) {
            return props.project.save({
              basePath: props.paths.userData,
              autoStart: true
            });
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
          hasError={props.project.state === ProjectViewState.Errored}
          playState={props.project.highlighted ? "running" : "idle"}
          timing={{ duration: 300, iterations: 2 }}
          keyframes={WIGGLE}
          onDoubleClick={props.onDoubleClick}
        >
          {
            props.project.diff.length > 0 &&
              <UpdateButton
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.stopPropagation();
                  props.project.sync();
                }}
                onDoubleClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
                >
                Pull {props.project.diff.length} {props.project.diff.length === 1 ? "update" : "updates"}
              </UpdateButton>
          }
          <ProjectTilePreview
            src={props.project.screenshot ? `http://localhost:${props.port}/${props.project.screenshot}` : null}
          />
          <ProjectTileBar>
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
              <button hidden type="submit" disabled={!props.project.editable}/>
            </ProjectProperties>
            <MoreButton
              onDoubleClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
              onClick={(e: React.MouseEvent<HTMLElement>) => {
                e.stopPropagation();
                const tid = uuid.v4();
                this.props.project.up.next(new Msg.UI.ContextMenuResponse(tid, this.props.project));
              }}/>
          </ProjectTileBar>
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
      case ProjectViewState.Removing:
        return "Removing";
      default:
        return "";
    }
}

interface MoreButtonProps {
  onClick: React.MouseEventHandler<HTMLElement>;
  onDoubleClick: React.MouseEventHandler<HTMLElement>;
}

const MoreButton = (props: MoreButtonProps) => (
  <StyledMoreButton onDoubleClick={props.onDoubleClick} onClick={props.onClick}>
    <MoreIcon viewBox="0 0 66 66">
      <circle cx="33" cy="15.2" r="5.9"/>
      <circle cx="33" cy="33" r="5.9"/>
      <circle cx="33" cy="50.8" r="5.9"/>
    </MoreIcon>
  </StyledMoreButton>
);

const StyledMoreButton = styled.a`
  margin-left: 15px;
  margin-right: -5px;
  color: #aaa;
  cursor: pointer;
  :hover {
    color: #0F0F32;
  }
`;

const MoreIcon = styled.svg`
  fill: currentColor;
  width: 21px;
  height: 21px;
`;

const ProjectTileBar = styled.div`
  box-sizing: border-box;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 10px 15px;
  width: 100%;
  box-shadow: 0 -1px 2px rgba(0, 0, 0, .05);
  min-height: 80px;
`;

const ProjectTilePreview = styled.div`
  position: relative;
  height: 200px;
  width: 100%;
  background-color: ${(props: any) => props.hasError ? props.theme.error : "#e5e5e5"};
  background-image: ${(props: any) => props.src && !props.hasError ? `url('${props.src}')` : "none"};
  background-size: cover;
  background-repeat: no-repeat;
  background-position: top center;
`;

const ProjectProperties = styled.div`
  flex: 1 1 100%;
  overflow: hidden;
`;

interface ProjectIconProps {
  loading: boolean;
  label: string;
  icon: string;
}

const ProjectIcon = (props: ProjectIconProps) => {
  if (!props.icon) {
    return (
      <StyledProjectIcon>
        <StyledIconContainer>
          <StyledDefaultIcon/>
        </StyledIconContainer>
        <IconCircumfence loading={props.loading}>
          <circle cx="50" cy="50" r="49"/>
        </IconCircumfence>
      </StyledProjectIcon>
    );
  }

  const parsed = svg.sanitize(svg.purge([svg.parse(props.icon)]))[0];
  const viewBox = parsed[1].viewBox.split(" ").map(Number);
  const bg = svg.detectBackground(parsed, {width: viewBox[2], height: viewBox[3]});

  return (
    <StyledProjectIcon bg={bg}>
      <StyledIconContainer>
        {svg.render(parsed)}
      </StyledIconContainer>
      <IconCircumfence loading={props.loading}>
        <circle cx="50" cy="50" r="49"/>
      </IconCircumfence>
    </StyledProjectIcon>
  );
};

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
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledDefaultIcon = styled(Icon).attrs({ symbol: "patternplate" })`
  width: 30px;
  height: 30px;
`;

const IconCircumfence = styled.svg.attrs({ viewBox: "0 0 100 100" })`
  position: absolute;
  width: 45px;
  height: 45px;
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
  position: relative;
  flex: 0 0 45px;
  height: 45px;
  width: 45px;
  margin-right: 10px;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  font-size: 13px;
  color: #999;
  background: ${(props: any) => props.bg ? props.bg : 'transparent'}
`;

interface ProjectTileProps {
  hasError: boolean;
  playState: "running" | "idle" | "paused";
  timing: any;
  keyframes: any;
  onDoubleClick: any;
  children: React.ReactNode;
}

const ProjectTile = (props: ProjectTileProps) => {
  return (
    <Animated.div
      playState={props.playState}
      timing={props.timing}
      keyframes={props.keyframes}
      >
      <StyledProjectTile
        hasError={props.hasError}
        onDoubleClick={props.onDoubleClick}
        >
        {props.children}
      </StyledProjectTile>
    </Animated.div>
  );
};

const StyledProjectTile = styled(tag(["hasError"])("div"))`
  position: relative;
  background: #fff;
  border-style: solid;
  border-color: ${(props: any) => props.hasError ? props.theme.error : "#979797"};
  border-width: ${(props: any) => props.hasError ? 2 : 1}px;
  border-radius: 3.5px;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  box-sizing: border-box;
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
      autoFocus={!props.readOnly}
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
  padding: 3px 5px;
  border: ${(props: any) => props.readOnly || !props.signify ? "1.5px dashed transparent" : "1.5px dashed #999"};
  border-radius: 6px;
  box-sizing: border-box;
  width: 100%;
  text-overflow: ellipsis;
  user-select: ${(props: any) => props.readOnly ? "none" : "auto"};
  cursor: ${(props: any) => props.readOnly ? "default": "select"};
  &:focus {
    outline: none;
    border: ${(props: any) => props.readOnly ? "1.5px dashed transparent" : "1.5px dashed #999"};
  }
`;

const UpdateButton = styled.button`
  position: absolute;
  top: -1px;
  right: 30px;
  z-index: 1;
  font-size: 13px;
  padding: 5px 10px;
  border: 1px solid white;
  box-shadow: 0 0 2px rgba(0, 0, 0, .05);
  color: #fff;
  background: #b3009b;
  user-select: none;
  border-radius: 0 0 1.5px 1.5px;
  cursor: pointer;
  &:focus {
    outline: none;
  }
`;
