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

if (!Object.deepFreeze) {
  throw new Error();
}

export const buildModule = (enhancers = {}) => {
  let validNodesByLanguage = new WeakMap();

  let isKnownValid = (language, node) => {
    let languageNodes = validNodesByLanguage.get(language);

    return languageNodes?.get(language)?.has(node) || false;
  };

  let registerNode = (language, node) => {
    let languageNodes = validNodesByLanguage.get(language);

    if (!languageNodes) {
      languageNodes = new WeakSet();
      validNodesByLanguage.set(language, languageNodes);
    }

    languageNodes.add(node);
  };

  let streamParse = (language, matcher, sourceText, props = o({}), options = {}) => {
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
      language,
      createParseStrategy_(matcher, props),
      options,
      registerNode,
    );
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

  return { isKnownValid, streamParse, buildEmbeddedTag, buildRawTag, buildTag };
};
