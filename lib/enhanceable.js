import { bablr, Source, Context } from '@bablr/bablr-vm';
import { createParseStrategy } from '@bablr/bablr-vm-strategy-parse';
import { sourceFromQuasis } from '@bablr/helpers/source';
import { evaluateReturnSync, get, list } from '@bablr/agast-helpers/tree';
import {
  buildTreeNodeMatcher,
  buildNodeFlags,
  buildTreeNodeMatcherOpen,
  buildPropertyMatcher,
  buildBoundNodeMatcher,
} from '@bablr/helpers/builders';
import { getEmbeddedMatcher } from '@bablr/agast-vm-helpers/deembed';
import { buildEmbeddedMatcher } from '@bablr/agast-vm-helpers/builders';
import { o } from '@bablr/helpers/grammar';
import { interpolate } from '@bablr/agast-helpers/template';

export { treeFromStreamSync, treeFromStreamAsync, streamFromTree } from '@bablr/agast-helpers/tree';

export const buildModule = (enhancers = {}) => {
  let context = Context.from(enhancers.bablrProduction);

  let streamParse = (language, matcher, sourceText, props = o({}), options = {}) => {
    let source = Source.from(sourceText);

    let bablr_ = bablr;
    let createParseStrategy_ = createParseStrategy;

    if (enhancers.bablr) {
      bablr_ = enhancers.bablr(bablr);
    }

    if (enhancers.createBablrStrategy) {
      createParseStrategy_ = enhancers.createBablrStrategy(createParseStrategy);
    }

    let matcher_ = matcher || language.defaultMatcher;

    return bablr_(context, source, language, createParseStrategy_(matcher_, props), options);
  };

  let buildEmbeddedTag = (
    language,
    defaultMatcher = language.defaultMatcher,
    props = o({}),
    options = {},
  ) => {
    let defaultTag = (quasis, ...expressions) => {
      return interpolate(
        expressions,
        evaluateReturnSync(
          streamParse(language, defaultMatcher, sourceFromQuasis(quasis), props, {
            ...options,
          }),
        ),
      );
    };

    return new Proxy(defaultTag, {
      apply(defaultTag, receiver, argsList) {
        return defaultTag.apply(receiver, argsList);
      },

      get(_, name) {
        return (quasis, ...expressions) => {
          let hasGap = !!get(
            ['nodeMatcher', 'open', 'flags', 'hasGapToken'],
            getEmbeddedMatcher(defaultMatcher),
          );

          let matcher = buildPropertyMatcher(
            null,
            buildBoundNodeMatcher(
              [...list('bindingMatchers', getEmbeddedMatcher(defaultMatcher))],
              buildTreeNodeMatcher(
                buildTreeNodeMatcherOpen(buildNodeFlags({ hasGap }), null, name),
              ),
            ),
          );

          return interpolate(
            expressions,
            evaluateReturnSync(
              streamParse(
                language,
                buildEmbeddedMatcher(matcher),
                sourceFromQuasis(quasis),
                props,
                {
                  ...options,
                },
              ),
            ),
          );
        };
      },
    });
  };

  let buildRawTag = (
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

  let buildTag = buildRawTag;

  return { streamParse, buildEmbeddedTag, buildRawTag, buildTag };
};
