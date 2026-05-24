import { buildModule } from './enhanceable.js';

export const { isKnownValid, streamParse, treeParse, buildEmbeddedTag, buildRawTag, buildTag } =
  buildModule();
