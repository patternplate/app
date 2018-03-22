import * as React from "react";
import styled from "react-emotion";

export function Logo() {
  return (
    <StyledLogo xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4504DA"/>
        <stop offset="100%" stopColor="#FF0353"/>
      </linearGradient>
      <g fill="url(#gradient)">
        <path d="M50 75a3.75 3.75 0 0 1-2-.56l-26.85-16.7a2.55 2.55 0 1 1 2.69-4.32L50 69.72l26.15-16.3a2.55 2.55 0 1 1 2.69 4.32L52 74.48a3.76 3.76 0 0 1-2 .52z"/>
        <path d="M50 65a3.69 3.69 0 0 1-1.95-.55L21.69 48a3.54 3.54 0 0 1 0-6l26.36-16.44a3.71 3.71 0 0 1 3.9 0L78.31 42a3.54 3.54 0 0 1 0 6L51.95 64.44A3.68 3.68 0 0 1 50 65zM26.3 45L50 59.77 73.7 45 50 30.23z"/>
      </g>
    </StyledLogo>
  );
}

const StyledLogo = styled("svg")`
  display: block;
  width: 30vmin;
  height: 30vmin;
  min-width: 150px;
  min-height: 150px;
  margin: 0 auto;
`;
