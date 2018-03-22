import * as React from "react";
import {Logo} from "../components";

const {styled, Text} = require("@patternplate/components");

export interface StartProps {
  value: string;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onChange: React.FormEventHandler<HTMLInputElement>;
}

export function Start(props: StartProps) {
  return (
    <form onSubmit={props.onSubmit}>
      <Logo/>
      <StyledInputBar>
        <StyledInput
          placeholder="Please enter a GIT url"
          onChange={props.onChange}
          value={props.value}
          />
        <StyledInputButton>
          <Text size="m">Add</Text>
        </StyledInputButton>
      </StyledInputBar>
    </form>
  );
}

const StyledInputBar = styled.div`
  display: flex;
  margin: 0 auto;
  width: 50%;
  min-width: 320px;
  max-width: 900px;
  border: 1px solid ${(props: any) => props.theme.color};
  border-radius: 2px;
`;

const StyledInputButton = styled.button.attrs({type: "submit"})`
  height: 60px;
  border: none;
  font-size: 20px;
  padding: 0 20px;
  border-left: 1px solid ${(props: any) => props.theme.recess};
  color: ${(props: any) => props.theme.invert};
  background: ${(props: any) => props.theme.color};
`;

const StyledInput = styled.input`
  flex-grow: 1;
  font-size: 20px;
  background: ${(props: any) => props.theme.background};
  color: ${(props: any) => props.theme.color};
  border: none;
  padding: 10px;
  &:focus {
    outline: none;
  }
`;
