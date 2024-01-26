import emptyStack from '@iter-tools/imm-stack';
import { evaluateSync, evaluateAsync, Context, Source } from '@bablr/vm';
import { createParseTrampoline } from '@bablr/generator-class-trampoline/parse';

const { hasOwn, freeze } = Object;

export function streamParseSync(language, sourceText, matcher) {
  const ctx = Context.from(language);
  const source = Source.from(sourceText);

  return evaluateSync(ctx, source, createParseTrampoline(matcher));
}

export function streamParseAsync(language, sourceText, matcher) {
  const ctx = Context.from(language);
  const source = Source.from(sourceText);

  return evaluateAsync(ctx, source, createParseTrampoline(matcher));
}

export function parseSync(language, sourceText, matcher) {
  const terminals = streamParseSync(language, sourceText, matcher);

  let nodes = emptyStack;
  let node;

  for (const terminal of terminals) {
    switch (terminal.type) {
      case 'OpenNodeTag': {
        const {
          path,
          tag: { language, type, attributes },
        } = terminal.value;

        const newNode = freeze({ language, type, children: [], properties: {}, attributes });

        if (node) {
          node.children.push({ type: 'ReferenceTag', value: path });

          const { pathName, pathIsArray } = path;

          if (pathIsArray) {
            if (!hasOwn(node.properties(pathName))) {
              node.properties[pathName] = [];
            }
            const array = node.properties[pathName];

            array.push(newNode);
          } else {
            node.properties[pathName] = newNode;
          }
        }

        nodes = nodes.push(newNode);
        node = nodes.value;

        break;
      }

      case 'CloseNodeTag': {
        const completedNode = node;

        freeze(completedNode.properties);
        freeze(completedNode.children);

        nodes = nodes.pop();
        node = nodes.value;
        break;
      }

      default: {
        node.children.push(terminal);
        break;
      }
    }
  }
}
