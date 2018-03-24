import * as React from "react";
import {observer} from "mobx-react";
import {ProjectViewModel, ProjectViewState} from "../view-models/project";
import {Logo} from "../components";

const {styled, keyframes, Text} = require("@patternplate/components");

export interface StartProps {
  value: string;
  valid: boolean;
  projects: ProjectViewModel[];
  src: string | null;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onChange: React.FormEventHandler<HTMLInputElement>;
}

@observer
export class Start extends React.Component<StartProps> {
  render() {
    const {props} = this;

    return (
      <form onSubmit={props.onSubmit}>
        <Logo/>
        <StyledInputBar>
          <StyledInput
            placeholder="Please enter a GIT url"
            onChange={props.onChange}
            value={props.value}
            />
          <StyledInputButton disabled={!props.valid}>
            <Text size="m">Add</Text>
          </StyledInputButton>
        </StyledInputBar>
        {
          props.projects.length > 0 &&
            <StyledProjectList>
              {
                props.projects.map(p => (
                  <StyledProjectItem highlighted={p.highlighted} key={p.model.id}>
                    <Text>{p.model.url}</Text>
                    <Text>{p.state}</Text>
                    {p.state === ProjectViewState.Fetching &&
                      <Text>{p.progress}</Text>
                    }
                    {
                      p.error && (
                        <Text>{p.error.message}</Text>
                      )
                    }
                    <button
                      type="button"
                      disabled={p.state === ProjectViewState.Fetching || p.state === ProjectViewState.Installing || p.state === ProjectViewState.Starting}
                      onClick={() => p.model.remove()}
                      >
                      Remove
                    </button>
                    <button
                      type="button"
                      disabled={p.state === ProjectViewState.Starting || p.state === ProjectViewState.Stopping}
                      onClick={ProjectViewState.Started ? () => p.model.stop(): () => p.model.start()}
                      >
                      {ProjectViewState.Started ? "Stop": "Start"}
                    </button>
                    <button
                      type="button"
                      disabled={p.state !== ProjectViewState.Started}
                      onClick={() => p.model.open()}
                      >
                      Open
                    </button>
                    {
                      props.src && (
                        <React.Fragment>
                          <StyledWebview src={props.src}/>
                          <StyledWebviewButton onClick={() => p.model.close()}>Close</StyledWebviewButton>
                        </React.Fragment>
                      )
                    }
                  </StyledProjectItem>
                ))}
            </StyledProjectList>
        }
      </form>
    );
  }
}

const StyledInputBar = styled.div`
  display: flex;
  margin: 0 auto;
  width: 50%;
  min-width: 320px;
  max-width: 900px;
  border: 1px solid ${(props: any) => props.theme.color};
  border-radius: 2px;
  margin-bottom: 50px;
`;

const StyledProjectList = styled.ul`
  margin: 0 auto;
  padding: 0;
  width: 50%;
  min-width: 320px;
  max-width: 900px;
  list-style: none;
  border-radius: 2px;
  border: 1px solid ${(props: any) => props.theme.color};
`;

const StyledProjectItem = styled.li`
  padding: 20px 10px;
  color: ${(props: any) => props.theme.color};
  border: 1px solid ${(props: any) => props.highlighted ? props.theme.active : "transparent"};
  background: ${(props: any) => props.highlighted ? props.theme.active : "transparent"};
  &:not(:last-child) {
    border-bottom: 1px solid ${(props: any) => props.theme.backgroundTertiary};
  }
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

const StyledWebview = styled("webview")`
  position: fixed;
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
