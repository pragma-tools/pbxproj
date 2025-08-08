import { generateComment } from './comments.js';

export function serialize(ast, options = {}) {
  const { commentStrategy = 'preserve' } = options;

  function commentFor(id, object) {
    if (commentStrategy === 'strip') return '';
    if (commentStrategy === 'generate')
      return ` /* ${generateComment(object)} */`;
    if (typeof commentStrategy === 'function')
      return ` /* ${commentStrategy(object)} */`;
    return '';
  }

  function serializeValue(value, indent = '') {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '()';
      }

      const items = value.map(item => serializeValue(item, `${indent}  `));
      if (
        items.every(item => typeof item === 'string' && !item.includes('\n'))
      ) {
        // Simple array on one line
        return `(${items.join(', ')})`;
      } else {
        // Multi-line array
        const arrayItems = value
          .map(item => `${indent}  ${serializeValue(item, `${indent}  `)}`)
          .join(',\n');
        return `(\n${arrayItems}\n${indent})`;
      }
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return '{}';
      }

      const dictItems = entries
        .map(
          ([key, val]) =>
            `${indent}  ${key} = ${serializeValue(val, `${indent}  `)};`,
        )
        .join('\n');
      return `{\n${dictItems}\n${indent}}`;
    }

    if (typeof value === 'string') {
      // Check if string needs quoting
      // Simple identifiers without spaces, special chars, and not starting with digits don't need quotes
      if (/^[a-zA-Z_][a-zA-Z0-9_.$/-]*$/.test(value) && !value.includes(' ')) {
        return value;
      } else {
        return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
      }
    }

    return String(value);
  }

  const out = [];
  out.push(`archiveVersion = ${ast.archiveVersion};`);
  out.push(`objectVersion = ${ast.objectVersion};`);
  out.push(`objects = {`);

  for (const [id, obj] of Object.entries(ast.objects)) {
    const comment = commentFor(id, obj);
    out.push(`  ${id}${comment} = {`);
    for (const [key, value] of Object.entries(obj)) {
      out.push(`    ${key} = ${serializeValue(value, '    ')};`);
    }
    out.push(`  };`);
  }

  out.push(`};`);
  out.push(`rootObject = ${ast.rootObject};`);

  return out.join('\n');
}

// Alias for serialize
export const stringify = serialize;
