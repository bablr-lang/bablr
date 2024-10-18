# bablr

[![come chat on Discord](https://img.shields.io/discord/1151914613089251388)](https://discord.gg/NfMNyYN6cX)

This is the primary API package for [BABLR](https://github.com/bablr-lang). Use it in combination with a BABLR language definition to perform parsing.

## Usage

```js
import { i, spam } from '@bablr/boot';
import { buildTag } from 'bablr';
import { buildCovers } from '@bablr/helpers/decorators';

const language = {
  canonicalURL:
    'https://bablr.org/languages/example/digits',
  grammar: class {
    constructor() {
      // If you can use decorators, `@Node` on a production will do this for you
      this.covers = buildCovers({
        [Symbol.for('@bablr/node')]: ['Number', 'Digit'],
      });
    }

    *Number() {
      while (yield i`eatMatch(<*Digit /> 'digits[]')`);
    }

    *Digit() {
      yield i`eat(/\d/)`;
    }
  },
};

const matcher = spam`<'https://bablr.org/languages/example/digits':Number />`;
const digits = buildTag(language, matcher);

digits`42`;

// <!0:cstml bablr-language="https://bablr.org/languages/example/digits">
// <$>
//   .:
//   <$Number>
//     digits[]: []
//     digits[]: <*Digit '4' />
//     digits[]: <*Digit '2' />
//   </>
// </>
```

## Prior Art

BABLR is actually portmanteau of [Babel](https://babeljs.io/) and [ANTLR](https://www.antlr.org/). It would be reasonable to describe this project as being a mixture of the ideas from those two, with a bit of help from [SrcML](https://www.srcml.org/), [Tree-sitter](https://tree-sitter.github.io/), and the fabulous [Redux](https://redux.js.org/).

It is also designed with the needs of [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) in mind.
