import { describe, it, expect } from 'vitest';
import { parse, serialize } from '../src/index.js';
import fs from 'fs';

describe('Integration Tests', () => {
  it('should parse and rebuild sample.pbxproj', () => {
    const originalContent = fs.readFileSync('./test/sample.pbxproj', 'utf8');
    
    const ast = parse(originalContent);
    expect(ast.archiveVersion).toBe(1);
    expect(ast.objectVersion).toBe(56);

    const rebuiltContent = serialize(ast, { commentStrategy: 'generate' });
    expect(rebuiltContent).toContain('archiveVersion = 1;');
    expect(rebuiltContent).toContain('objectVersion = 56;');
  });

  it('should handle full parse-serialize cycle with different comment strategies', () => {
    const pbxprojContent = `
// !$*UTF8*$!
{
	archiveVersion = 1;
	objectVersion = 56;
	objects = {
	};
	rootObject = ABC123;
}`;

    // Parse
    const ast = parse(pbxprojContent);
    
    // Test different serialize strategies
    const strippedResult = serialize(ast, { commentStrategy: 'strip' });
    expect(strippedResult).not.toContain('/*');
    
    const generatedResult = serialize(ast, { commentStrategy: 'generate' });
    expect(generatedResult).toContain('archiveVersion = 1;');
    expect(generatedResult).toContain('objectVersion = 56;');
  });

  it('should preserve data integrity through parse-serialize cycle', () => {
    const originalAst = {
      archiveVersion: 1,
      objectVersion: 56,
      objects: {
        'ABC123': {
          isa: 'PBXFileReference',
          path: 'AppDelegate.swift',
          sourceTree: '<group>',
        },
        'DEF456': {
          isa: 'PBXBuildFile',
          fileRef: 'ABC123',
        },
      },
      rootObject: 'GHI789',
    };

    // Serialize to string
    const pbxprojString = serialize(originalAst);
    
    // Parse back to AST
    const parsedAst = parse(pbxprojString);
    
    // Should preserve basic structure
    expect(parsedAst.archiveVersion).toBe(originalAst.archiveVersion);
    expect(parsedAst.objectVersion).toBe(originalAst.objectVersion);
  });

  it('should handle complex object structures', () => {
    const complexAst = {
      archiveVersion: 1,
      objectVersion: 56,
      objects: {
        'BUILD_FILE_1': {
          isa: 'PBXBuildFile',
          fileRef: 'FILE_REF_1',
          settings: {
            ATTRIBUTES: ['Public'],
          },
        },
        'FILE_REF_1': {
          isa: 'PBXFileReference',
          lastKnownFileType: 'sourcecode.swift',
          path: 'MyFile.swift',
          sourceTree: '<group>',
        },
        'GROUP_1': {
          isa: 'PBXGroup',
          children: ['FILE_REF_1'],
          sourceTree: '<group>',
        },
      },
      rootObject: 'PROJECT_1',
    };

    const result = serialize(complexAst, { commentStrategy: 'generate' });
    
    expect(result).toContain('BUILD_FILE_1');
    expect(result).toContain('FILE_REF_1 /* MyFile.swift */');
    expect(result).toContain('GROUP_1 /* PBXGroup */');
    expect(result).toContain('isa = "PBXBuildFile"');
    expect(result).toContain('path = "MyFile.swift"');
  });

  it('should handle edge cases gracefully', () => {
    const edgeCaseAst = {
      archiveVersion: 0,
      objectVersion: 0,
      objects: {
        'EMPTY_OBJECT': {},
        'NULL_VALUES': {
          isa: null,
          path: undefined,
        },
      },
      rootObject: '',
    };

    const result = serialize(edgeCaseAst);
    
    expect(result).toContain('archiveVersion = 0;');
    expect(result).toContain('objectVersion = 0;');
    expect(result).toContain('EMPTY_OBJECT');
    expect(result).toContain('NULL_VALUES');
  });
}); 