import { parse } from './parse.js';
import { serialize, stringify } from './serialize.js';

export { parse, serialize, stringify };

// Legacy alias for backward compatibility
export { serialize as build };
