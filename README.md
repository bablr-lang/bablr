# bablr

[![come chat on Discord](https://img.shields.io/discord/1151914613089251388)](https://discord.gg/NfMNyYN6cX)

This is the priary API package for [BABLR](https://github.com/bablr-lang). Use it in combination with a BABLR language definition to perform parsing.

## Usage

```js
import { i } from '@bablr/boot';
import { buildTag } from 'bablr';
import { Node } from '@bablr/helpers/decorators';

const language = {
  canonicalURL: 'https://bablr.org/languages/example/digits',
  grammar: class {
    @Node
    *Number() {
      while (yield i`eat(<*Digit> 'digits[]')`);
    }

    @Node
    *Digit() {
      yield i`eat(/\d/)`;
    }
  };
}

const digits = buildTag(language, 'Number');

digits`42`;

// <Number>
//   digits[]:
//   <*Digit>
//     '4'
//   </>
//   digits[]:
//   <*Digit>
//     '2'
//   </>
//  </>
```

## Prior Art

BABLR is actually portmanteau of [Babel](https://babeljs.io/) and [ANTLR](https://www.antlr.org/). It would be reasonable to describe this project as being a mixture of the ideas from those two, with a bit of help from [SrcML](https://www.srcml.org/), [Tree-sitter](https://tree-sitter.github.io/), and the fabulous [Redux](https://redux.js.org/).

It is also designed with the needs of [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) in mind.
