import { evaluate as agastEvaluate, Context as AgastContext } from '@bablr/agast-vm';
import { evaluate, Context, Source } from '@bablr/bablr-vm';
import { buildDependentLanguages } from '@bablr/helpers/grammar';
import { runSync, runAsync } from '@bablr/agast-vm-helpers/run';
import { createParseStrategy } from '@bablr/bablr-vm-strategy-parse';

export { treeFromStreamSync, treeFromStreamAsync } from '@bablr/agast-helpers/tree';

export function streamParse(language, sourceText, matcher, props) {
  const agastCtx = AgastContext.create();
  const ctx = Context.from(agastCtx.facade, buildDependentLanguages(language));
  const source = Source.from(sourceText);

  return agastEvaluate(
    agastCtx,
    evaluate(ctx, language, source, createParseStrategy(language.canonicalURL, matcher, props)),
  );
}

export const streamParseSync = (...args) => runSync(streamParse(...args));
export const streamParseAsync = (...args) => runAsync(streamParse(...args));
