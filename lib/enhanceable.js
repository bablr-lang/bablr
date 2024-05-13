import { evaluate as agastEvaluate, Context as AgastContext } from '@bablr/agast-vm';
import { evaluate, Context, Source } from '@bablr/bablr-vm';
import { buildDependentLanguages } from '@bablr/helpers/grammar';
import { createParseStrategy } from '@bablr/bablr-vm-strategy-parse';
import { buildSpamMatcher } from '@bablr/agast-vm-helpers/builders';
import { sourceFromQuasis, fillGapsWith } from '@bablr/helpers/source';
import { treeFromStreamSync } from '@bablr/agast-helpers/tree';

export { treeFromStreamSync, treeFromStreamAsync, streamFromTree } from '@bablr/agast-helpers/tree';

export function streamParse(language, type, sourceText, props, enhancers = {}) {
  const agastCtx = AgastContext.create();
  const ctx = Context.from(
    agastCtx.facade,
    buildDependentLanguages(language),
    enhancers.bablrProduction,
  );
  const source = Source.from(sourceText);
  const matcher = buildSpamMatcher(type);

  let agastStrategy = agastEvaluate;
  let parseStrategy = createParseStrategy;
  let bablrStrategy = evaluate;

  if (enhancers.agastStrategy) {
    agastStrategy = enhancers.agastStrategy(agastStrategy);
  }

  if (enhancers.bablrStrategy) {
    bablrStrategy = enhancers.bablrStrategy(bablrStrategy);
  }

  if (enhancers.parseStrategy) {
    parseStrategy = enhancers.parseStrategy(parseStrategy);
  }

  return agastStrategy(
    agastCtx,
    bablrStrategy(ctx, language, source, parseStrategy(language.canonicalURL, matcher, props)),
  );
}

export const buildTag = (language, defaultType, props, enhancers = {}) => {
  const defaultTag = (quasis, ...exprs) => {
    return treeFromStreamSync(
      fillGapsWith(
        exprs,
        streamParse(language, defaultType, sourceFromQuasis(quasis.raw), props, enhancers),
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
            streamParse(language, type, sourceFromQuasis(quasis.raw), {}, enhancers),
          ),
        );
      };
    },
  });
};
