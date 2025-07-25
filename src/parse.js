export function parse(pbxprojText, options = {}) {
  const lines = pbxprojText.split('\n');
  const result = {
    archiveVersion: null,
    objectVersion: null,
    objects: {},
    rootObject: null,
  };

  for (const line of lines) {
    if (line.includes('archiveVersion')) {
      result.archiveVersion = parseInt(line.match(/\d+/)?.[0]);
    }
    if (line.includes('objectVersion')) {
      result.objectVersion = parseInt(line.match(/\d+/)?.[0]);
    }
  }

  return result;
} 