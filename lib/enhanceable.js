import { evaluate as agast, Context as AgastContext } from '@bablr/agast-vm';
import { createBablrStrategy, Source } from '@bablr/bablr-vm';
import { buildDependentLanguages } from '@bablr/helpers/grammar';
import { createParseStrategy, Context } from '@bablr/bablr-vm-strategy-parse';
import { buildSpamMatcher } from '@bablr/agast-vm-helpers/builders';
import { sourceFromQuasis, fillGapsWith } from '@bablr/helpers/source';
import { treeFromStreamSync } from '@bablr/agast-helpers/tree';

export { treeFromStreamSync, treeFromStreamAsync, streamFromTree } from '@bablr/agast-helpers/tree';

export { AgastContext, Context };

export function streamParse(language, type, sourceText, props, options = {}) {
  const { enhancers = {} } = options;
  const agastContext = options.agastContext || AgastContext.create();
  const context =
    options.context ||
    Context.from(agastContext.facade, buildDependentLanguages(language), enhancers.bablrProduction);
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

  const tokens = agast_(
    agastContext,
    createBablrStrategy_(
      source,
      createParseStrategy_(context, language.canonicalURL, matcher, props),
    ),
    options,
  );

  return { context: context.facade, tokens };
}

export const buildTag = (language, defaultType, props, options = {}) => {
  const defaultTag = (quasis, ...exprs) => {
    return treeFromStreamSync(
      fillGapsWith(
        exprs,
        streamParse(language, defaultType, sourceFromQuasis(quasis.raw), props, options).tokens,
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
            streamParse(language, type, sourceFromQuasis(quasis.raw), {}, options).tokens,
          ),
        );
      };
    },
  });
};
