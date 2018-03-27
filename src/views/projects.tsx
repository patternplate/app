import * as React from "react";

const {styled, Text} = require("@patternplate/components");

export interface ProjectsProps {
  projects: any[];
}

export function Projects(props: ProjectsProps) {
  return (
    <ProjectsView>
      <ProjectsHeader>
        <Headline>
          Your libraries
        </Headline>
        <ProjectAdd>
          Add new library
        </ProjectAdd>
      </ProjectsHeader>
    </ProjectsView>
  );
}

const ProjectsView = styled.div`
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
    <StyledProjectAdd>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="30"
        height="30"
        >
        <g transform="translate(-435 -261)">
          <mask id="a">
            <use fill="#fff" transform="translate(435 261)" xlinkHref="#path0_fill"/>
            <use fill="#fff" transform="translate(435 261)" xlinkHref="#path1_fill"/>
            <use fill="#fff" transform="translate(435 261)" xlinkHref="#path2_fill"/>
          </mask>
          <g mask="url(#a)">
            <use fill="#FFF" transform="translate(435 261)" xlinkHref="#path3_stroke_2x"/>
          </g>
        </g>
        <defs>
          <path id="path0_fill" fillRule="evenodd" d="M15 30a15 15 0 1 0 0-30 15 15 0 0 0 0 30z"/>
          <path id="path1_fill" fillRule="evenodd" d="M15 7h1v16h-1V7z"/>
          <path id="path2_fill" fillRule="evenodd" d="M23 15v1H7v-1h16z"/>
          <path id="path3_stroke_2x" d="M15 7V6h-1v1h1zm1 0h1V6h-1v1zm0 16v1h1v-1h-1zm-1 0h-1v1h1v-1zm8-8h1v-1h-1v1zm0 1v1h1v-1h-1zM7 16H6v1h1v-1zm0-1v-1H6v1h1zm8 16c9 0 16-7 16-16h-2c0 8-6 14-14 14v2zm16-16c0-9-7-16-16-16v2c8 0 14 6 14 14h2zM15-1C6-1-1 6-1 15h2C1 7 7 1 15 1v-2zM-1 15c0 9 7 16 16 16v-2C7 29 1 23 1 15h-2zm16-7h1V6h-1v2zm0-1v16h2V7h-2zm1 15h-1v2h1v-2zm0 1V7h-2v16h2zm6-8v1h2v-1h-2zm1 0H7v2h16v-2zM8 16v-1H6v1h2zm-1 0h16v-2H7v2z"/>
        </defs>
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
  &:focus {
    outline: none;
  }
  > svg {
    margin-right: 10px;
  }
`;
