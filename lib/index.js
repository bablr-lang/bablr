import { evaluateSync, evaluateAsync, Context, Source } from '@bablr/agast-vm';
import { createParseTrampoline } from '@bablr/generator-class-trampoline/parse';

export { treeFromTokensSync, treeFromTokensAsync } from '@bablr/agast-helpers';

export function streamParseSync(language, sourceText, matcher) {
  const ctx = Context.from(language);
  const source = Source.from(sourceText);

  return evaluateSync(ctx, source, createParseTrampoline(matcher));
}

export function streamParseAsync(language, sourceText, matcher) {
  const ctx = Context.from(language);
  const source = Source.from(sourceText);

  return evaluateAsync(ctx, source, createParseTrampoline(matcher));
}
