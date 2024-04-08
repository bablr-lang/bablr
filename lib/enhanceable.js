import { evaluate as agastEvaluate, Context as AgastContext } from '@bablr/agast-vm';
import { evaluate, Context, Source } from '@bablr/bablr-vm';
import { buildDependentLanguages } from '@bablr/helpers/grammar';
import { createParseStrategy } from '@bablr/bablr-vm-strategy-parse';
import { buildSpamMatcher } from '@bablr/agast-vm-helpers/builders';
import { sourceFromQuasis, fillGapsWith } from '@bablr/helpers/source';
import { treeFromStreamSync } from '@bablr/agast-helpers/tree';
import { runSync, runAsync } from '@bablr/agast-vm-helpers/run';

export { treeFromStreamSync, treeFromStreamAsync, streamFromTree } from '@bablr/agast-helpers/tree';

export function streamParse(language, sourceText, matcher, props, enhancers = {}) {
  const agastCtx = AgastContext.create();
  const ctx = Context.from(agastCtx.facade, buildDependentLanguages(language));
  const source = Source.from(sourceText);

  let runStrategy = agastEvaluate;
  let bablrStrategy = createParseStrategy;
  let agastStrategy = evaluate;

  if (enhancers.runStrategy) {
    runStrategy = enhancers.runStrategy(runStrategy);
  }

  if (enhancers.agastStrategy) {
    agastStrategy = enhancers.agastStrategy(agastStrategy);
  }

  if (enhancers.bablrStrategy) {
    bablrStrategy = enhancers.bablrStrategy(bablrStrategy);
  }

  return runStrategy(
    agastCtx,
    agastStrategy(
      ctx,
      language,
      source,
      bablrStrategy(language.canonicalURL, matcher, props, enhancers.bablrProduction),
    ),
  );
}

export const buildTag = (language, defaultType, props, enhancers = {}) => {
  const defaultTag = (quasis, ...exprs) => {
    return treeFromStreamSync(
      fillGapsWith(
        exprs,
        streamParseSync(
          language,
          sourceFromQuasis(quasis.raw),
          buildSpamMatcher(defaultType),
          props,
          enhancers,
        ),
      ),
    );
  };

  return new Proxy(defaultTag, {
    apply(defaultTag, receiver, argsList) {
      return defaultTag.apply(receiver, argsList);
    },

    get(_, type) {
      return (quasis, ...exprs) => {
        return treeFromStreamSync(
          fillGapsWith(
            exprs,
            streamParseSync(
              language,
              sourceFromQuasis(quasis.raw),
              buildSpamMatcher(type),
              {},
              enhancers,
            ),
          ),
        );
      };
    },
  });
};

export const streamParseSync = (...args) => runSync(streamParse(...args));
export const streamParseAsync = (...args) => runAsync(streamParse(...args));
