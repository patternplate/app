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
  display: grid;
  grid-gap: 15px;
  grid-auto-columns: 1fr;
  padding: 30px 15px;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  list-style-type: none;
  margin-top: 40px;
`;

const ProjectListItem = styled.li`

`;
