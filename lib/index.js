import { evaluateSync, evaluateAsync, Context, Source } from '@bablr/agast-vm';
import { createParseStrategy } from '@bablr/generator-class-trampoline/parse';

export { treeFromStreamSync, treeFromStreamAsync } from '@bablr/agast-helpers/tree';

export function streamParseSync(language, sourceText, matcher, props) {
  const ctx = Context.create();
  const source = Source.from(sourceText);

  return evaluateSync(ctx, source, createParseStrategy(language, matcher, props));
}

export function streamParseAsync(language, sourceText, matcher, props) {
  const ctx = Context.create();
  const source = Source.from(sourceText);

  return evaluateAsync(ctx, source, createParseStrategy(language, matcher, props));
}
