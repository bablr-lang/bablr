import { evaluate as agast, Context as AgastContext } from '@bablr/agast-vm';
import { createBablrStrategy, Source, Context } from '@bablr/bablr-vm';
import { createParseStrategy } from '@bablr/bablr-vm-strategy-parse';
import { sourceFromQuasis } from '@bablr/helpers/source';
import { evaluateReturnSync, getCooked } from '@bablr/agast-helpers/tree';
import { buildFullyQualifiedSpamMatcher } from '@bablr/agast-vm-helpers/builders';

export { treeFromStreamSync, treeFromStreamAsync, streamFromTree } from '@bablr/agast-helpers/tree';

export { AgastContext, Context };

export function streamParse(language, matcher, sourceText, props, options = {}) {
  const { enhancers = {} } = options;

  const source = Source.from(sourceText);

  const context =
    language instanceof Context ? language : Context.from(AgastContext.create(), language);

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
    createBablrStrategy_(context, source, createParseStrategy_(matcher, props)),
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
        const matcher = buildFullyQualifiedSpamMatcher(
          {},
          getCooked(defaultMatcher.properties.open.properties.language.properties.content),
          type,
        );
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
