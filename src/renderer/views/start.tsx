import * as React from "react";
import { observer } from "mobx-react";

const { styled, Text } = require("@patternplate/components");

interface Greeting {
  location: string;
  utterance: string;
}

const GREETINGS: Greeting[] = [
  {
    location: "Hamburg",
    utterance: "Moin!"
  },
  {
    location: "Frankfurt",
    utterance: "Gude!"
  },
  {
    location: "Munich",
    utterance: "Servus!"
  },
  {
    location: "Berlin",
    utterance: "Tach!"
  },
  {
    location: "Prague",
    utterance: "Ahoj!"
  }
];

const greeting = (): Greeting => {
  const index = Math.min(Math.round(Math.random() * GREETINGS.length), GREETINGS.length - 1);
  return GREETINGS[index];
}

export interface StartProps {
  value: string;
  valid: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onChange: React.FormEventHandler<HTMLInputElement>;
  onLinkClick: React.MouseEventHandler<HTMLAnchorElement>;
}

@observer
export class StartView extends React.Component<StartProps> {
  state = {
    greeting: {
      location: "",
      utterance: ""
    }
  };

  componentWillMount() {
    this.setState({
      greeting: greeting()
    });
  }

  render() {
    const {props} = this;
    const {greeting} = this.state;

    return (
      <form onSubmit={props.onSubmit}>
        <Greeting>
          <Headline order={0}>{greeting.utterance}
            <Tooltip data-title={`That's "Hi!" in ${greeting.location}`}>*</Tooltip>
          </Headline>
          <Description>
            Paste an url to get started<br/>
            No idea what to paste? Try this one:<br/>
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
    );
  }
}

const Tooltip = styled.sup`
  position: relative;
`;

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
  cursor: help;

  ${Tooltip} {
    ::before {
      position: absolute;
      content: attr(data-title);
      opacity: 0;
      background: #000;
      white-space: nowrap;
      font-size: 20px;
      padding: 5px 10px;
      transform: translate(15px, -25%);
      transition: all .3s ease-in-out;
    }
  }

  &:hover {
    ${Tooltip} {
      ::before {
        opacity: 1;
        transform: translate(15px, -50%);
      }
    }
  }
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

