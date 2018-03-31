import * as React from "react";
import { observer } from "mobx-react";
import * as uuid from "uuid";

import { ProjectView } from "./project";
import { ProjectViewModel } from "../view-models/project";
import { ProjectViewCollection } from "../view-models/projects";
import * as Msg from "../../messages";

const { styled, Text } = require("@patternplate/components");

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
          {props.projects.items.map((project: ProjectViewModel) => <ProjectView key={project.id} project={project}/>)}
        </ProjectsList>
        {
          props.projects.startedProject &&
            <React.Fragment>
              <WebView
                port={props.projects.startedProject.port}
                onCloseClick={() => (props.projects.startedProject as ProjectViewModel).stop()}
                project={props.projects.startedProject}
                />
            </React.Fragment>
        }
      </StyledProjectsView>
    );
  }
}

const StyledProjectsView = styled.div`
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

interface WebViewProps {
  onCloseClick: React.MouseEventHandler<HTMLButtonElement>;
  port: number;
  project: ProjectViewModel;
}

@observer
class WebView extends React.Component<WebViewProps> {
  ref?: any;

  componentDidMount() {
    if (this.ref) {
      const tid = uuid.v4();
      this.props.project.up.next(new Msg.Project.ProjectOpenNotification(tid, this.props.project.id));

      this.ref.addEventListener("did-finish-load", () => {
        this.props.project.up.next(new Msg.Project.ProjectOpenedNotification(tid));
      });
    }
  }

  render() {
    const {props} = this;
    return (
      <StyledWebviewContainer loaded={props.project.isOpened()}>
        <StyledWebviewButton onClick={() => props.project.stop()}>Close</StyledWebviewButton>
        <StyledWebview innerRef={(ref: any) => this.ref = ref} src={`http://localhost:${props.project.port}`}/>
      </StyledWebviewContainer>
    )
  }
}

const StyledWebviewContainer = styled.div`
  position: fixed;
  z-index: 1;
  top: 40px;
  left: 0;
  right: 0;
  bottom: 0;
  transform: ${(props: any) => props.loaded ? `translateY(0)` : `translateY(100%)`};
  background: #0F0F32;
`;

const StyledWebview = styled("webview")`
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const StyledWebviewButton = styled.button`
  position: fixed;
  z-index: 2;
  top: 22px;
  left: 20px;
`;
