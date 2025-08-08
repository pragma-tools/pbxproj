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
        ABC123: {
          isa: 'PBXFileReference',
          path: 'AppDelegate.swift',
          sourceTree: '<group>',
        },
        DEF456: {
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
        BUILD_FILE_1: {
          isa: 'PBXBuildFile',
          fileRef: 'FILE_REF_1',
          settings: {
            ATTRIBUTES: ['Public'],
          },
        },
        FILE_REF_1: {
          isa: 'PBXFileReference',
          lastKnownFileType: 'sourcecode.swift',
          path: 'MyFile.swift',
          sourceTree: '<group>',
        },
        GROUP_1: {
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
    expect(result).toContain('isa = PBXBuildFile');
    expect(result).toContain('path = MyFile.swift');
  });

  it('should handle edge cases gracefully', () => {
    const edgeCaseAst = {
      archiveVersion: 0,
      objectVersion: 0,
      objects: {
        EMPTY_OBJECT: {},
        NULL_VALUES: {
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

  describe('recursive structures integration', () => {
    it('should handle full cycle with nested dictionaries', () => {
      const originalAst = {
        archiveVersion: 1,
        objectVersion: 56,
        objects: {
          ROOT_GROUP: {
            isa: 'PBXGroup',
            children: ['SUB_GROUP'],
            sourceTree: '<group>',
          },
          SUB_GROUP: {
            isa: 'PBXGroup',
            children: ['FILE_REF'],
            path: 'SubDirectory',
            sourceTree: '<group>',
          },
          FILE_REF: {
            isa: 'PBXFileReference',
            path: 'File.swift',
            sourceTree: '<group>',
            settings: {
              attributes: ['Public'],
              compilerFlags: ['-Wall', '-O2'],
            },
          },
        },
        rootObject: 'ROOT_GROUP',
      };

      // Serialize to string
      const serialized = serialize(originalAst, {
        commentStrategy: 'generate',
      });

      // Parse back to AST
      const parsed = parse(serialized);

      // Verify nested structure integrity
      expect(parsed.objects.ROOT_GROUP.children).toEqual(['SUB_GROUP']);
      expect(parsed.objects.SUB_GROUP.children).toEqual(['FILE_REF']);
      expect(parsed.objects.SUB_GROUP.path).toBe('SubDirectory');
      expect(parsed.objects.FILE_REF.settings.attributes).toEqual(['Public']);
      expect(parsed.objects.FILE_REF.settings.compilerFlags).toEqual([
        '-Wall',
        '-O2',
      ]);
    });

    it('should preserve complex array structures in full cycle', () => {
      const originalAst = {
        archiveVersion: 1,
        objectVersion: 56,
        objects: {
          BUILD_CONFIG: {
            isa: 'XCBuildConfiguration',
            buildSettings: {
              HEADER_SEARCH_PATHS: [
                '/usr/include',
                '/opt/local/include',
                '$(inherited)',
              ],
              OTHER_CFLAGS: ['-DDEBUG=1', '-Wall', '-Wextra'],
              LIBRARY_SEARCH_PATHS: [
                '/usr/lib',
                {
                  path: '/custom/lib',
                  recursive: true,
                },
              ],
            },
          },
        },
        rootObject: 'BUILD_CONFIG',
      };

      // Full cycle
      const serialized = serialize(originalAst);
      const parsed = parse(serialized);

      // Verify array preservation
      expect(
        parsed.objects.BUILD_CONFIG.buildSettings['HEADER_SEARCH_PATHS'],
      ).toEqual(['/usr/include', '/opt/local/include', '$(inherited)']);
      expect(parsed.objects.BUILD_CONFIG.buildSettings['OTHER_CFLAGS']).toEqual(
        ['-DDEBUG=1', '-Wall', '-Wextra'],
      );

      // Verify nested object in array
      const libraryPaths =
        parsed.objects.BUILD_CONFIG.buildSettings['LIBRARY_SEARCH_PATHS'];
      expect(libraryPaths[0]).toBe('/usr/lib');
      expect(libraryPaths[1].path).toBe('/custom/lib');
      expect(libraryPaths[1].recursive).toBe('true');
    });

    it('should handle deeply nested structures in full cycle', () => {
      const originalAst = {
        archiveVersion: 1,
        objectVersion: 56,
        objects: {
          PROJECT: {
            isa: 'PBXProject',
            targets: ['TARGET1'],
            configurations: {
              debug: {
                settings: {
                  nested: {
                    deep: {
                      value: 'found',
                      array: [1, 2, { inner: 'test' }],
                    },
                  },
                },
              },
            },
          },
        },
        rootObject: 'PROJECT',
      };

      // Full cycle
      const serialized = serialize(originalAst);
      const parsed = parse(serialized);

      // Verify deep nesting
      const deepValue =
        parsed.objects.PROJECT.configurations.debug.settings.nested.deep.value;
      expect(deepValue).toBe('found');

      const deepArray =
        parsed.objects.PROJECT.configurations.debug.settings.nested.deep.array;
      expect(deepArray[0]).toBe(1);
      expect(deepArray[1]).toBe(2);
      expect(deepArray[2].inner).toBe('test');
    });

    it('should preserve data types in nested structures', () => {
      const originalAst = {
        archiveVersion: 1,
        objectVersion: 56,
        objects: {
          MIXED_TYPES: {
            isa: 'PBXFileReference',
            stringValue: 'text',
            numberValue: 42,
            floatValue: 3.14,
            negativeValue: -123,
            arrayValue: ['string', 456, 7.89],
            nestedDict: {
              innerString: 'inner',
              innerNumber: 100,
              innerArray: [1, 'two', 3.0],
            },
          },
        },
        rootObject: 'MIXED_TYPES',
      };

      // Full cycle
      const serialized = serialize(originalAst);
      const parsed = parse(serialized);

      const obj = parsed.objects.MIXED_TYPES;

      // Verify primitive types
      expect(obj.stringValue).toBe('text');
      expect(obj.numberValue).toBe(42);
      expect(obj.floatValue).toBe(3.14);
      expect(obj.negativeValue).toBe(-123);

      // Verify array with mixed types
      expect(obj.arrayValue).toEqual(['string', 456, 7.89]);

      // Verify nested dictionary with mixed types
      expect(obj.nestedDict.innerString).toBe('inner');
      expect(obj.nestedDict.innerNumber).toBe(100);
      expect(obj.nestedDict.innerArray).toEqual([1, 'two', 3]);
    });

    it('should handle real pbxproj-like structure with multiple levels', () => {
      const originalAst = {
        archiveVersion: 1,
        objectVersion: 56,
        classes: {},
        objects: {
          MAIN_GROUP: {
            isa: 'PBXGroup',
            children: ['SOURCE_GROUP', 'RESOURCES_GROUP'],
            sourceTree: '<group>',
          },
          SOURCE_GROUP: {
            isa: 'PBXGroup',
            children: ['APP_DELEGATE', 'VIEW_CONTROLLER'],
            path: 'Sources',
            sourceTree: '<group>',
          },
          RESOURCES_GROUP: {
            isa: 'PBXGroup',
            children: ['ASSETS'],
            path: 'Resources',
            sourceTree: '<group>',
          },
          APP_DELEGATE: {
            isa: 'PBXFileReference',
            lastKnownFileType: 'sourcecode.swift',
            path: 'AppDelegate.swift',
            sourceTree: '<group>',
          },
          VIEW_CONTROLLER: {
            isa: 'PBXFileReference',
            lastKnownFileType: 'sourcecode.swift',
            path: 'ViewController.swift',
            sourceTree: '<group>',
          },
          ASSETS: {
            isa: 'PBXFileReference',
            lastKnownFileType: 'folder.assetcatalog',
            path: 'Assets.xcassets',
            sourceTree: '<group>',
          },
          BUILD_FILE_1: {
            isa: 'PBXBuildFile',
            fileRef: 'APP_DELEGATE',
            settings: {
              ATTRIBUTES: ['Public'],
            },
          },
          BUILD_FILE_2: {
            isa: 'PBXBuildFile',
            fileRef: 'VIEW_CONTROLLER',
          },
        },
        rootObject: 'MAIN_GROUP',
      };

      // Full cycle
      const serialized = serialize(originalAst, {
        commentStrategy: 'generate',
      });
      const parsed = parse(serialized);

      // Verify complete structure integrity
      expect(parsed.objects.MAIN_GROUP.children).toEqual([
        'SOURCE_GROUP',
        'RESOURCES_GROUP',
      ]);
      expect(parsed.objects.SOURCE_GROUP.children).toEqual([
        'APP_DELEGATE',
        'VIEW_CONTROLLER',
      ]);
      expect(parsed.objects.RESOURCES_GROUP.children).toEqual(['ASSETS']);

      // Verify file references
      expect(parsed.objects.APP_DELEGATE.path).toBe('AppDelegate.swift');
      expect(parsed.objects.VIEW_CONTROLLER.path).toBe('ViewController.swift');
      expect(parsed.objects.ASSETS.path).toBe('Assets.xcassets');

      // Verify build files with settings
      expect(parsed.objects.BUILD_FILE_1.fileRef).toBe('APP_DELEGATE');
      expect(parsed.objects.BUILD_FILE_1.settings.ATTRIBUTES).toEqual([
        'Public',
      ]);
      expect(parsed.objects.BUILD_FILE_2.fileRef).toBe('VIEW_CONTROLLER');

      // Verify root structure
      expect(parsed.rootObject).toBe('MAIN_GROUP');
      expect(parsed.archiveVersion).toBe(1);
      expect(parsed.objectVersion).toBe(56);
    });
  });
});
