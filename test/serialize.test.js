import { describe, it, expect } from 'vitest';
import { serialize, stringify } from '../src/serialize.js';

describe('serialize', () => {
  it('should serialize basic AST to pbxproj format', () => {
    const ast = {
      archiveVersion: 1,
      objectVersion: 56,
      objects: {},
      rootObject: 'ABC123',
          };

      const result = serialize(ast);

      expect(result).toBe(
      'archiveVersion = 1;\n' +
      'objectVersion = 56;\n' +
      'objects = {\n' +
      '};\n' +
      'rootObject = ABC123;'
    );
  });

  it('should serialize AST with objects', () => {
    const ast = {
      archiveVersion: 1,
      objectVersion: 56,
      objects: {
        'ABC123': {
          isa: 'PBXFileReference',
          path: 'AppDelegate.swift',
        },
        'DEF456': {
          isa: 'PBXBuildFile',
          fileRef: 'ABC123',
        },
      },
      rootObject: 'GHI789',
    };

    const result = serialize(ast);

    expect(result).toContain('ABC123 = {');
    expect(result).toContain('DEF456 = {');
    expect(result).toContain('isa = "PBXFileReference";');
    expect(result).toContain('path = "AppDelegate.swift";');
    expect(result).toContain('fileRef = "ABC123";');
    expect(result).toContain('rootObject = GHI789;');
  });

  it('should strip comments when commentStrategy is "strip"', () => {
    const ast = {
      archiveVersion: 1,
      objectVersion: 56,
      objects: {
        'ABC123': {
          isa: 'PBXFileReference',
          path: 'AppDelegate.swift',
        },
      },
      rootObject: 'ABC123',
    };

    const result = serialize(ast, { commentStrategy: 'strip' });

    expect(result).not.toContain('/*');
    expect(result).not.toContain('*/');
    expect(result).toContain('ABC123 = {');
  });

  it('should generate comments when commentStrategy is "generate"', () => {
    const ast = {
      archiveVersion: 1,
      objectVersion: 56,
      objects: {
        'ABC123': {
          isa: 'PBXFileReference',
          path: 'AppDelegate.swift',
        },
        'DEF456': {
          isa: 'PBXBuildFile',
          name: 'Build File',
        },
      },
      rootObject: 'ABC123',
    };

    const result = serialize(ast, { commentStrategy: 'generate' });

    expect(result).toContain('ABC123 /* AppDelegate.swift */ = {');
    expect(result).toContain('DEF456 /* Build File */ = {');
  });

  it('should use custom comment function', () => {
    const ast = {
      archiveVersion: 1,
      objectVersion: 56,
      objects: {
        'ABC123': {
          isa: 'PBXFileReference',
          path: 'AppDelegate.swift',
        },
      },
      rootObject: 'ABC123',
    };

    const customCommentFn = (obj) => `Custom: ${obj.isa}`;
    const result = serialize(ast, { commentStrategy: customCommentFn });

    expect(result).toContain('ABC123 /* Custom: PBXFileReference */ = {');
  });

  it('should handle null values in AST', () => {
    const ast = {
      archiveVersion: null,
      objectVersion: null,
      objects: {},
      rootObject: null,
    };

    const result = serialize(ast);

    expect(result).toContain('archiveVersion = null;');
    expect(result).toContain('objectVersion = null;');
    expect(result).toContain('rootObject = null;');
  });
});

describe('stringify (alias)', () => {
  it('should work identically to serialize', () => {
    const ast = {
      archiveVersion: 1,
      objectVersion: 56,
      objects: {
        'ABC123': {
          isa: 'PBXFileReference',
          path: 'AppDelegate.swift',
        },
      },
      rootObject: 'ABC123',
    };

    const serializeResult = serialize(ast, { commentStrategy: 'generate' });
    const stringifyResult = stringify(ast, { commentStrategy: 'generate' });

    expect(stringifyResult).toBe(serializeResult);
    expect(stringifyResult).toContain('ABC123 /* AppDelegate.swift */ = {');
  });
}); 