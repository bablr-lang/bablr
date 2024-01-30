# bablr

[![come chat on Discord](https://img.shields.io/discord/1151914613089251388)](https://discord.gg/NfMNyYN6cX)

It's a parser! It's a linter! It's a formatter! It's an IDE! It's BABLR!

BABLR helps people write code by letting them easily use Javascript code to create and modify code written in any language. In particular, it enables more accurate analysis of code than has previously been possible in order to support the creation of new fully-semantic (visual, tactile) code editors.

An HTML-like streaming serialization format called CSTML supports efficient streaming of BABLR parse trees across language or device barriers.

## Usage

Rather than a formal schema definition, a language is defined through the provision of useful APIs for working with valid documents written in that language.

This API differs from that of most other production-grade parsers, which are most often parser generators. BABLR grammars are purely runtime Javascript, and so tend to be extremely lightweight compared to comparable compiled forms. All parsing and traversal is done in a streaming manner to the extent possible.

**BABLR is unready for production usage, and will continue to be so until `v1.0.0` is released.** For right now the more people try out this code and provide me feedback, the faster I will make progress towards production-readiness!

```js
import { parseCSTML } from 'bablr';
import { i } from '@bablr/boot';

const digits = class {
  constructor() {
    this.covers = {
      [Symbol.for('@bablr/node')]: ['Number', 'Digit'],
    };
  }

  *Number() {
    while (yield i`eat(<| Digit .digits |>)`);
  }

  *Digit() {
    yield i`eat(/\d/)`;
  }
};

parseCSTML(digits, '42');

// <Number>
//   digits:
//   <Digit>
//     '4'
//   </>
//   digits:
//   <Digit>
//     '2'
//   </>
//  </>
```

## Prior Art

BABLR is actually portmanteau of [Babel](https://babeljs.io/) and [ANTLR](https://www.antlr.org/). It would be reasonable to describe this project as being a mixture of the ideas from those two, with a bit of help from [SrcML](https://www.srcml.org/), [Tree-sitter](https://tree-sitter.github.io/), and the fabulous [Redux](https://redux.js.org/).

It is also designed with the needs of [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) in mind.
