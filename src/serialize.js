import { generateComment } from './comments.js';

export function serialize(ast, options = {}) {
  const { commentStrategy = 'preserve' } = options;

  function commentFor(id, object) {
    if (commentStrategy === 'strip') return '';
    if (commentStrategy === 'generate') return ` /* ${generateComment(object)} */`;
    if (typeof commentStrategy === 'function') return ` /* ${commentStrategy(object)} */`;
    return '';
  }

  const out = [];
  out.push(`archiveVersion = ${ast.archiveVersion};`);
  out.push(`objectVersion = ${ast.objectVersion};`);
  out.push(`objects = {`);

  for (const [id, obj] of Object.entries(ast.objects)) {
    const comment = commentFor(id, obj);
    out.push(`  ${id}${comment} = {`);
    for (const [key, value] of Object.entries(obj)) {
      out.push(`    ${key} = ${JSON.stringify(value)};`);
    }
    out.push(`  };`);
  }

  out.push(`};`);
  out.push(`rootObject = ${ast.rootObject};`);

  return out.join('\n');
}

// Alias for serialize
export const stringify = serialize; 