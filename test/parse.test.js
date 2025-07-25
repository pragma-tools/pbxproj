import { describe, it, expect } from 'vitest';
import { parse } from '../src/parse.js';

describe('parse', () => {
  it('should parse basic pbxproj structure', () => {
    const pbxprojContent = `
// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 56;
	objects = {
	};
	rootObject = 1A2B3C4D5E6F7890ABCDEF06 /* Project object */;
}`;

    const result = parse(pbxprojContent);

    expect(result).toEqual({
      archiveVersion: 1,
      objectVersion: 56,
      objects: {},
      rootObject: null,
    });
  });

  it('should handle missing archiveVersion', () => {
    const pbxprojContent = `
{
	objectVersion = 50;
	objects = {};
}`;

    const result = parse(pbxprojContent);

    expect(result.archiveVersion).toBeNull();
    expect(result.objectVersion).toBe(50);
  });

  it('should handle missing objectVersion', () => {
    const pbxprojContent = `
{
	archiveVersion = 1;
	objects = {};
}`;

    const result = parse(pbxprojContent);

    expect(result.archiveVersion).toBe(1);
    expect(result.objectVersion).toBeNull();
  });

  it('should parse different archiveVersion values', () => {
    const pbxprojContent = `
{
	archiveVersion = 2;
	objectVersion = 60;
}`;

    const result = parse(pbxprojContent);

    expect(result.archiveVersion).toBe(2);
    expect(result.objectVersion).toBe(60);
  });

  it('should handle empty input', () => {
    const result = parse('');

    expect(result).toEqual({
      archiveVersion: null,
      objectVersion: null,
      objects: {},
      rootObject: null,
    });
  });

  it('should handle malformed version lines', () => {
    const pbxprojContent = `
{
	archiveVersion = invalid;
	objectVersion = also_invalid;
}`;

    const result = parse(pbxprojContent);

    expect(result.archiveVersion).toBeNaN();
    expect(result.objectVersion).toBeNaN();
  });
}); 