import { evaluate as agastEvaluate, Context as AgastContext } from '@bablr/agast-vm';
import { evaluate, Context, Source } from '@bablr/bablr-vm';
import { runSync, runAsync } from '@bablr/agast-vm-helpers/run';
import { createParseStrategy } from '@bablr/bablr-vm-strategy-parse';

export { treeFromStreamSync, treeFromStreamAsync } from '@bablr/agast-helpers/tree';

export function streamParse(language, sourceText, matcher, props) {
  const agastCtx = AgastContext.create();
  const ctx = Context.from(agastCtx.facade, language);
  const source = Source.from(sourceText);

  return agastEvaluate(agastCtx, evaluate(ctx, source, createParseStrategy(matcher, props)));
}

export const streamParseSync = (...args) => runSync(streamParse(...args));
export const streamParseAsync = (...args) => runAsync(streamParse(...args));
