export function generateComment(object) {
  if (object.path) return object.path;
  if (object.name) return object.name;
  return object.isa || 'Object';
}
