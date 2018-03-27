import * as React from "react";
import {observer} from "mobx-react";

const {styled, keyframes, Text} = require("@patternplate/components");

export interface StartProps {
  value: string;
  valid: boolean;
  src: string | null;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onChange: React.FormEventHandler<HTMLInputElement>;
  onLinkClick: React.MouseEventHandler<HTMLAnchorElement>;
}

@observer
export class Start extends React.Component<StartProps> {
  render() {
    const {props} = this;
    return (
      <form onSubmit={props.onSubmit}>
        <Greeting>
          <Headline order={0}>Moin!</Headline>
          <Description>
            {"Paste an url and get started, e.g: "}
            <Link
              title="Add Alva Designkit"
              onClick={props.onLinkClick}
              href="https://github.com/meetalva/designkit.git"
              >
              github.com/meetalva/designkit.git
            </Link>
          </Description>
        </Greeting>
        <StyledInputBar>
          <StyledInput
            placeholder="Feed me with GIT (or click the link above)"
            onChange={props.onChange}
            value={props.value}
            />
          {props.valid &&
            <StyledInputButton>
              <Text size="m">Add</Text>
            </StyledInputButton>
          }
        </StyledInputBar>
      </form>
    )
    /* return (
      <form onSubmit={props.onSubmit}>
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
                      disabled={p.inTransition()}
                      onClick={() => p.model.remove()}
                      >
                      Remove
                    </button>
                    <button
                      type="button"
                      disabled={p.state !== ProjectViewState.Errored}
                      onClick={() => p.model.process()}
                      >
                      Retry
                    </button>
                    <button
                      type="button"
                      disabled={p.inTransition()}
                      onClick={() => p.model.install()}
                      >
                      Install
                    </button>
                    <button
                      type="button"
                      disabled={p.state !== ProjectViewState.Installed}
                      onClick={() => p.model.build()}
                      >
                      Build
                    </button>
                    <button
                      type="button"
                      disabled={p.inTransition() || p.lt(ProjectViewState.Built)}
                      onClick={p.state === ProjectViewState.Started ? () => p.model.stop(): () => p.model.start()}
                      >
                      {p.state === ProjectViewState.Started ? "Stop": "Start"}
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
    ); */
  }
}

const Greeting = styled.div`
  margin-top: 150px;
  margin-bottom: 45px;
`;

const Headline = styled.h1`
  font-size: 60px;
  font-family: Helvetica;
  font-weight: normal;
  color: #fff;
  margin: 0 0 30px 0;
`;

const Description = styled.p`
  font-family: Helvetica;
  font-size: 32px;
  color: #fff;
  margin: 0;
  line-height: 1.4;
  max-width: 30ch;
`;

const Link = styled.a`
  color: ${(props: any) => props.theme.active};
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  white-space: nowrap;
`;

const StyledInputBar = styled.div`
  display: flex;
  width: 65%;
  min-width: 320px;
  max-width: 900px;
  border: 1px solid ${(props: any) => props.theme.color};
  border-radius: 3px;
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
  box-sizing: border-box;
  flex-grow: 1;
  font-size: 20px;
  height: 60px;
  color: ${(props: any) => props.theme.color};
  border: none;
  padding: 20px;
  background: transparent;
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
