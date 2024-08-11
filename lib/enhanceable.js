import { evaluate as agast, Context as AgastContext } from '@bablr/agast-vm';
import { createBablrStrategy, Source } from '@bablr/bablr-vm';
import { createParseStrategy, Context } from '@bablr/bablr-vm-strategy-parse';
import { sourceFromQuasis } from '@bablr/helpers/source';
import { evaluateReturnSync } from '@bablr/agast-helpers/tree';

export { treeFromStreamSync, treeFromStreamAsync, streamFromTree } from '@bablr/agast-helpers/tree';

export { AgastContext, Context };

const { freeze } = Object;

export function streamParse(context, matcher, sourceText, props, options = {}) {
  const { enhancers = {} } = options;

  const source = Source.from(sourceText);

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
    context.agast,
    createBablrStrategy_(source, createParseStrategy_(context, matcher, props)),
    options,
  );
}

export const buildEmbeddedTag = (context, defaultMatcher, props, options = {}) => {
  const defaultTag = (quasis, ...expressions) => {
    return evaluateReturnSync(
      streamParse(context, defaultMatcher, sourceFromQuasis(quasis), props, {
        ...options,
        expressions,
      }),
    );
  };

  return new Proxy(defaultTag, {
    apply(defaultTag, receiver, argsList) {
      return defaultTag.apply(receiver, argsList);
    },

    get(_, type) {
      return (quasis, ...expressions) => {
        const matcher = freeze({ ...defaultMatcher, type });
        return evaluateReturnSync(
          streamParse(context, matcher, sourceFromQuasis(quasis), props, {
            ...options,
            expressions,
          }),
        );
      };
    },
  });
};

export const buildRawTag = (context, defaultMatcher, props, options = {}) => {
  const embeddedTag = buildEmbeddedTag(context, defaultMatcher, props, options);

  const defaultTag = (quasis, ...exprs) => {
    return embeddedTag(quasis.raw, ...exprs);
  };

  return new Proxy(defaultTag, {
    apply(defaultTag, receiver, argsList) {
      return defaultTag.apply(receiver, argsList);
    },

    get(_, type) {
      return (quasis, ...exprs) => {
        return embeddedTag[type](quasis, ...exprs);
      };
    },
  });
};

export const buildTag = buildRawTag;
