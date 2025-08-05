import { bablr, Source, Context } from '@bablr/bablr-vm';
import { createParseStrategy } from '@bablr/bablr-vm-strategy-parse';
import { sourceFromQuasis } from '@bablr/helpers/source';
import { evaluateReturnSync, get } from '@bablr/agast-helpers/tree';
import {
  buildBasicNodeMatcher,
  buildNodeFlags,
  buildOpenNodeMatcher,
  buildPropertyMatcher,
} from '@bablr/helpers/builders';
import { getEmbeddedMatcher } from '@bablr/agast-vm-helpers/deembed';
import { buildEmbeddedMatcher } from '@bablr/agast-vm-helpers/builders';
import { o } from '@bablr/helpers/grammar';

export { treeFromStreamSync, treeFromStreamAsync, streamFromTree } from '@bablr/agast-helpers/tree';

export function streamParse(language, matcher, sourceText, props = o({}), options = {}) {
  let { enhancers = {} } = options;

  let source = Source.from(sourceText);

  let context = Context.from(language, enhancers.bablrProduction);

  let bablr_ = bablr;
  let createParseStrategy_ = createParseStrategy;

  if (enhancers.bablr) {
    bablr_ = enhancers.bablr(bablr);
  }

  if (enhancers.createBablrStrategy) {
    createParseStrategy_ = enhancers.createBablrStrategy(createParseStrategy);
  }

  return bablr_(
    context,
    source,
    createParseStrategy_(language.canonicalURL, matcher, props),
    options,
  );
}

export const buildEmbeddedTag = (
  language,
  defaultMatcher = language.defaultMatcher,
  props = o({}),
  options = {},
) => {
  let defaultTag = (quasis, ...expressions) => {
    return evaluateReturnSync(
      streamParse(language, defaultMatcher, sourceFromQuasis(quasis), props, {
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
        let hasGap = !!get(
          ['nodeMatcher', 'open', 'flags', 'hasGapToken'],
          getEmbeddedMatcher(defaultMatcher),
        );

        let matcher = buildPropertyMatcher(
          null,
          get('bindingMatcher', getEmbeddedMatcher(defaultMatcher)),
          buildBasicNodeMatcher(buildOpenNodeMatcher(buildNodeFlags({ hasGap }), type)),
        );

        return evaluateReturnSync(
          streamParse(language, buildEmbeddedMatcher(matcher), sourceFromQuasis(quasis), props, {
            ...options,
            expressions,
          }),
        );
      };
    },
  });
};

export const buildRawTag = (
  language,
  defaultMatcher = language.defaultMatcher,
  props = o({}),
  options = {},
) => {
  let embeddedTag = buildEmbeddedTag(language, defaultMatcher, props, options);

  let defaultTag = (quasis, ...exprs) => {
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
