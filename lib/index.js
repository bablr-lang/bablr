import { runSync, runAsync } from '@bablr/agast-vm-helpers/run';
import { streamParse as streamParse_, buildTag as buildTag_ } from './enhanceable.js';

export const streamParse = (language, sourceText, matcher, props) => {
  return streamParse_(language, sourceText, matcher, props);
};

export const buildTag = (language, defaultType, props) => {
  return buildTag_(language, defaultType, props);
};

export const streamParseSync = (...args) => runSync(streamParse(...args));
export const streamParseAsync = (...args) => runAsync(streamParse(...args));
