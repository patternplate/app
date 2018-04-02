import * as React from "react";
import { observer } from "mobx-react";

import { ProjectView } from "./project";
import { ProjectsToolbar } from "./projects-toolbar";
import { Tower } from "./tower";

import { ProjectViewModel } from "../view-models/project";
import { ProjectViewCollection } from "../view-models/projects";

const { styled } = require("@patternplate/components");

export interface ProjectsProps {
  projects: ProjectViewCollection;
  onAddClick: React.MouseEventHandler<HTMLElement>;
  onNewClick: React.MouseEventHandler<HTMLElement>;
}

@observer
export class ProjectsView extends React.Component<ProjectsProps> {
  render() {
    const { props } = this;

    return (
      <StyledProjectsView>
        <ProjectsToolbar onNewClick={props.onNewClick} onAddClick={props.onAddClick}/>
        <Tower>
          <ProjectsList>
            {props.projects.items.map((project: ProjectViewModel) => (
              <ProjectView
                key={project.id}
                project={project}
                onDoubleClick={project.isStarted()
                  ? () => project.open()
                  : () => project.start({open: true})
                }
                />
            ))}
          </ProjectsList>
        </Tower>
      </StyledProjectsView>
    );
  }
}

const StyledProjectsView = styled.div``;

const ProjectsList = styled.ul`
  margin-top: 40px;
  list-style-type: none;
  padding: 0;
`;
