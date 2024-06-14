import { evaluate as agast, Context as AgastContext } from '@bablr/agast-vm';
import { createBablrStrategy, Source } from '@bablr/bablr-vm';
import { buildDependentLanguages } from '@bablr/helpers/grammar';
import { createParseStrategy, Context } from '@bablr/bablr-vm-strategy-parse';
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

  let agast_ = agast;
  let createBablrStrategy_ = createBablrStrategy;
  let createParseStrategy_ = createParseStrategy;

  if (enhancers.agast) {
    agast_ = enhancers.agast(agast);
  }

  if (enhancers.createBablrStrategy) {
    createBablrStrategy_ = enhancers.createBablrStrategy(createBablrStrategy);
  }

  if (enhancers.createParseStrategy) {
    createParseStrategy_ = enhancers.createParseStrategy(createParseStrategy);
  }

  return agast_(
    agastCtx,
    createBablrStrategy_(source, createParseStrategy_(ctx, language.canonicalURL, matcher, props)),
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
