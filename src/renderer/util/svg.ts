import { createElement as h } from "react";
import { DOMParser, XMLSerializer } from "xmldom";
import { camelCase } from "lodash";

const { styled } = require("@patternplate/components");

const parser = new DOMParser();
const serializer = new XMLSerializer();

const TAG_NAMES = ["circle", "g", "path", "polygon", "rect", "svg"];

/**
 * These attributes are valid on all SVG elements and accepted by this
 * renderer.
 * All attributes will be converted to their camelCase version.
 * This allows using valid SVG strings.
 * Extend this list to allow additional default SVG attributes.
 *
 * @type {Array}
 */
const SHARED_ATTRIBUTES = ["fill", "stroke", "stroke-width"];

const ATTRIBUTES: {[element: string]: string[]} = {
  circle: [...SHARED_ATTRIBUTES, "cx", "cy", "r", "style"],
  g: [...SHARED_ATTRIBUTES, "x", "y"],
  path: [...SHARED_ATTRIBUTES, "d", "style"],
  polygon: [...SHARED_ATTRIBUTES, "points"],
  rect: [...SHARED_ATTRIBUTES, "x", "y", "width", "height", "style"],
  svg: ["width", "height", "viewBox", "x", "y", "style", "xmlns"]
};

function attributes(node: Element, key: number | string) {
  return (ATTRIBUTES[node.tagName] || []).reduce(
    (props: {[key: string]: any}, name: string) => {
      const attribute = node.attributes.getNamedItem(name);
      const reactProp = camelCase(name);
      if (attribute && attribute.specified) {
        props[reactProp] = attribute.value;
      }
      return props;
    },
    { key }
  );
}

export function btoa(source: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(source).toString("base64")}`;
}

export function parse(source: string) {
  const doc = parser.parseFromString(source, "image/svg+xml");
  const parsed = Array.prototype.slice.call(doc.childNodes).find((node: Element) => node.tagName === "svg");
  parsed.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return parsed;
}

export function purge(parsed: Element[]): Element[] {
  return Array.prototype.slice.call(parsed)
    .filter((node: Element) => TAG_NAMES.indexOf(node.tagName) > -1)
    .map((node: Element) => {
      const children: any = node.childNodes;
      (node as any).childNodes = purge(children);

      const attributes = ATTRIBUTES[node.tagName] || [];

      for (let i = 0; i < node.attributes.length; i++) {
        const attribute = node.attributes[i];
        if (attributes.indexOf(attribute.name) === -1) {
          node.removeAttribute(attribute.name);
        }
      }

      return node;
    });
}

export function render(element: any): React.ReactNode {
  const [tagName, props, children = []] = element;
  const { style, ...rest } = props;
  const tag = styled(tagName)`
    ${style};
  `;
  return h(tag, rest, children.map((c: any) => render(c)));
}

export function sanitize(parsed: Element[]): any[] {
  return [...parsed].map((node, i) => [
    (node as Element).tagName,
    attributes((node as Element), i),
    sanitize(node.childNodes as any)
  ]);
}

export function stringify(tree: Document): string {
  return serializer.serializeToString(tree);
}

interface Renderable {
  0: string;
  1: {[key: string]: any};
  2: Renderable[];
}

interface Criteria {
  width: number;
  height: number;
}

export function detectBackground(tree: Renderable, criteria: Criteria): string {
  const bgs: string[] = [];

  walk(tree, node => {
    if (node[0] !== "rect") {
      return;
    }
    if (Number(node[1].height) !== criteria.height) {
      return;
    }
    if (Number(node[1].width) !== criteria.width) {
      return;
    }
    if (node[1].fill) {
      bgs.push(node[1].fill);
    }
  });

  return bgs[bgs.length - 1];
}

function walk(node: Renderable, predicate: (node: Renderable) => void) {
  predicate(node);
  node[2].forEach(n => walk(n, predicate));
}
