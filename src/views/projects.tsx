import * as React from "react";
import { observer } from "mobx-react";

import { ProjectViewModel } from "../view-models/project";
import { ProjectViewCollection } from "../view-models/projects";

const { Box } = require("styled-system");
const { css, styled, keyframes, Text } = require("@patternplate/components");
const { Animated } = require("react-web-animation");

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

export interface ProjectsProps {
  projects: ProjectViewCollection;
  onAddClick: React.MouseEventHandler<HTMLElement>;
}

@observer
export class ProjectsView extends React.Component<ProjectsProps> {
  render() {
    const { props } = this;

    return (
      <StyledProjectsView>
        <ProjectsHeader>
          <Headline>
            Your libraries
          </Headline>
          <ProjectAdd onClick={props.onAddClick}>
            Add new library
          </ProjectAdd>
        </ProjectsHeader>
        <ProjectsList>
          {props.projects.items
            .map((project: ProjectViewModel) => (
              <form
                key={project.id}
                onSubmit={(e: any) => {
                  e.preventDefault();
                  project.editable ? project.save() : project.open();
                }}
                onReset={(e: any) => {
                  e.preventDefault();
                  project.editable ? project.discard() : project.remove();
                }}
                >
                <ProjectTile
                  playState={project.highlighted ? "running" : "idle"}
                  timing={{duration: 300, iterations: 2}}
                  keyframes={WIGGLE}
                  >
                    <ProjectIcon/>
                    <ProjectProperties>
                      <ProjectName
                        onChange={(e: any) => project.setInputName(e.target.value)}
                        readOnly={project.editable !== true}
                        value={project.inputName || project.name || ""}
                        />
                      <ProjectUrl
                        onChange={(e: any) => project.setInputUrl(e.target.value)}
                        readOnly={project.editable !== true}
                        value={project.inputUrl || project.url || ""}
                        />
                    </ProjectProperties>
                    <ProjectActions>
                      <ProjectAction
                        actionType="negative"
                        type="reset"
                        >
                        <Text>{project.editable ? "Discard" : "Remove"}</Text>
                      </ProjectAction>
                      <ProjectAction
                        actionType="affirmative"
                        type="submit"
                        >
                        <Text>{project.editable ? "Save" : "Open"}</Text>
                      </ProjectAction>
                    </ProjectActions>
                </ProjectTile>
              </form>
          ))}
        </ProjectsList>
      </StyledProjectsView>
    );
  }
}

const StyledProjectsView = styled.div`
  margin-top: 150px;
`;

const ProjectsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Headline = styled(Text)`
  margin: 0;
  font-size: 36px;
  color: #fff;
`;

const ProjectAdd = (props: any) => {
  return (
    <StyledProjectAdd onClick={props.onClick}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="30"
        height="30"
        >
        <path d="M15 7h1v16h-1V7z"/>
        <path d="M23 15v1H7v-1h16z"/>
      </svg>
      <Text size="m">{props.children}</Text>
    </StyledProjectAdd>
  );
}

const StyledProjectAdd = styled.button`
  display: flex;
  align-items: center;
  border: none;
  background: none;
  font-size: 22px;
  padding: 0;
  color: ${(props: any) => props.theme.color};
  cursor: pointer;
  &:hover {
    color: ${(props: any) => props.theme.active};
  }
  &:focus {
    outline: none;
  }
  > svg {
    margin-right: 10px;
    fill: currentColor;
    color: inherit;
    border: 1px solid currentColor;
    border-radius: 50%;
    overflow: hidden;
  }
`;

const ProjectsList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const ProjectIcon = styled.div`
  flex: 0 0 90px;
  height: 90px;
  width: 90px;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
  margin-right: 15px;
`;

const ProjectProperties = styled.div`
  flex: 1 1 100%;
  overflow: hidden;
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
      full={false}
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
      signify={true}
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
  &:not(:last-child) {
    margin-bottom: 7px;
  }
  &:focus {
    outline: none;
    border: ${(props: any) => props.readOnly ? "1.5px dashed transparent" : "1.5px dashed #999"};
  }
`;
