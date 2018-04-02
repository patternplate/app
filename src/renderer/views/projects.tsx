import * as React from "react";
import { observer } from "mobx-react";

import { ProjectView } from "./project";
import { ProjectsToolbar } from "./projects-toolbar";

import { ProjectViewModel } from "../view-models/project";
import { ProjectViewCollection } from "../view-models/projects";

const { styled } = require("@patternplate/components");

export interface ProjectsProps {
  projects: ProjectViewCollection;
  onEscape(): void;
  onAddClick: React.MouseEventHandler<HTMLElement>;
  onNewClick: React.MouseEventHandler<HTMLElement>;
}

@observer
export class ProjectsView extends React.Component<ProjectsProps> {
  render() {
    const { props } = this;

    return (
      <StyledProjectsView onKeyDown={(e: any) => {
        if (e.key === "Escape") {
          props.onEscape();
        }
      }}>
        <ProjectsToolbar onNewClick={props.onNewClick} onAddClick={props.onAddClick}/>
        <ProjectsList>
          {props.projects.items.map((project: ProjectViewModel) => (
            <ProjectListItem editable={project.editable}>
              <ProjectView
                key={project.id}
                project={project}
                onDoubleClick={project.editable
                  ? () => {}
                  : project.isStarted()
                    ? () => project.open()
                    : () => project.start({open: true})
                }
                />
            </ProjectListItem>
          ))}
        </ProjectsList>
      </StyledProjectsView>
    );
  }
}

const StyledProjectsView = styled.div``;

const ProjectsList = styled.ul`
  list-style-type: none;
  padding: 30px 15px;
  margin-top: 40px;
`;

const ProjectListItem = styled.li`
  display: inline-block;
  margin: 0 15px 15px 0;
  width: 100%;
  min-width: 250px;
  max-width: 100%;
  @media screen and (min-width: 660px) {
    width: 50%;
    max-width: 350px;
  }
  @media screen and (min-width: 1024px) {
    width: 32%;
    max-width: 300px;
  }
  @media screen and (min-width: 1440px) {
    width: 25%;
    max-width: 333px;
  }
`;
