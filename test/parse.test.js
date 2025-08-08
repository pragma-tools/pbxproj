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
      rootObject: '1A2B3C4D5E6F7890ABCDEF06',
      classes: {},
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
      classes: {},
    });
  });

  it('should handle malformed version lines', () => {
    const pbxprojContent = `
{
	archiveVersion = invalid;
	objectVersion = also_invalid;
}`;

    const result = parse(pbxprojContent);

    expect(result.archiveVersion).toBe('invalid');
    expect(result.objectVersion).toBe('also_invalid');
  });

  describe('recursiveness and nested structures', () => {
    it('should parse nested dictionaries', () => {
      const pbxprojContent = `{
        level1 = {
          level2 = {
            level3 = {
              deepValue = "nested_value";
            };
          };
        };
      }`;

      const result = parse(pbxprojContent);

      expect(result.level1.level2.level3.deepValue).toBe('nested_value');
    });

    it('should parse nested arrays', () => {
      const pbxprojContent = `{
        nestedArrays = (
          ("item1", "item2"),
          ("item3", "item4"),
          (
            ("deep1", "deep2"),
            ("deep3", "deep4")
          )
        );
      }`;

      const result = parse(pbxprojContent);

      expect(result.nestedArrays).toEqual([
        ['item1', 'item2'],
        ['item3', 'item4'],
        [
          ['deep1', 'deep2'],
          ['deep3', 'deep4'],
        ],
      ]);
    });

    it('should parse arrays inside dictionaries', () => {
      const pbxprojContent = `{
        project = {
          children = (
            "file1.swift",
            "file2.swift"
          );
          settings = {
            buildConfigs = (
              "Debug",
              "Release"
            );
          };
        };
      }`;

      const result = parse(pbxprojContent);

      expect(result.project.children).toEqual(['file1.swift', 'file2.swift']);
      expect(result.project.settings.buildConfigs).toEqual([
        'Debug',
        'Release',
      ]);
    });

    it('should parse dictionaries inside arrays', () => {
      const pbxprojContent = `{
        configurations = (
          {
            name = "Debug";
            settings = {
              DEBUG = 1;
            };
          },
          {
            name = "Release";
            settings = {
              NDEBUG = 1;
            };
          }
        );
      }`;

      const result = parse(pbxprojContent);

      expect(result.configurations).toHaveLength(2);
      expect(result.configurations[0].name).toBe('Debug');
      expect(result.configurations[0].settings.DEBUG).toBe(1);
      expect(result.configurations[1].name).toBe('Release');
      expect(result.configurations[1].settings.NDEBUG).toBe(1);
    });

    it('should parse complex mixed structures like real pbxproj', () => {
      const pbxprojContent = `{
        objects = {
          ABC123 = {
            isa = "PBXGroup";
            children = (
              "DEF456",
              "GHI789"
            );
            sourceTree = "<group>";
          };
          DEF456 = {
            isa = "PBXFileReference";
            path = "AppDelegate.swift";
            fileEncoding = 4;
            lastKnownFileType = "sourcecode.swift";
            sourceTree = "<group>";
          };
          GHI789 = {
            isa = "PBXBuildFile";
            fileRef = "DEF456";
            settings = {
              ATTRIBUTES = (
                "Public"
              );
            };
          };
        };
      }`;

      const result = parse(pbxprojContent);

      // Check PBXGroup
      expect(result.objects.ABC123.isa).toBe('PBXGroup');
      expect(result.objects.ABC123.children).toEqual(['DEF456', 'GHI789']);
      expect(result.objects.ABC123.sourceTree).toBe('<group>');

      // Check PBXFileReference
      expect(result.objects.DEF456.isa).toBe('PBXFileReference');
      expect(result.objects.DEF456.path).toBe('AppDelegate.swift');
      expect(result.objects.DEF456.fileEncoding).toBe(4);

      // Check PBXBuildFile with nested settings
      expect(result.objects.GHI789.isa).toBe('PBXBuildFile');
      expect(result.objects.GHI789.fileRef).toBe('DEF456');
      expect(result.objects.GHI789.settings.ATTRIBUTES).toEqual(['Public']);
    });

    it('should parse very deep nested structures', () => {
      const pbxprojContent = `{
        deep = {
          level1 = {
            level2 = {
              level3 = {
                level4 = {
                  level5 = {
                    array = (
                      {
                        innerDict = {
                          finalValue = "found_it";
                        };
                      }
                    );
                  };
                };
              };
            };
          };
        };
      }`;

      const result = parse(pbxprojContent);

      expect(
        result.deep.level1.level2.level3.level4.level5.array[0].innerDict
          .finalValue,
      ).toBe('found_it');
    });

    it('should handle mixed data types in nested structures', () => {
      const pbxprojContent = `{
        mixed = {
          stringValue = "text";
          numberValue = 42;
          booleanValue = true;
          arrayValue = (
            "string_in_array",
            123,
            {
              nestedInArray = "nested_value";
            }
          );
          dictValue = {
            innerString = "inner";
            innerNumber = 3.14;
            innerArray = (1, 2, 3);
          };
        };
      }`;

      const result = parse(pbxprojContent);

      expect(result.mixed.stringValue).toBe('text');
      expect(result.mixed.numberValue).toBe(42);
      expect(result.mixed.booleanValue).toBe('true'); // parsed as string
      expect(result.mixed.arrayValue[0]).toBe('string_in_array');
      expect(result.mixed.arrayValue[1]).toBe(123);
      expect(result.mixed.arrayValue[2].nestedInArray).toBe('nested_value');
      expect(result.mixed.dictValue.innerString).toBe('inner');
      expect(result.mixed.dictValue.innerNumber).toBe(3.14);
      expect(result.mixed.dictValue.innerArray).toEqual([1, 2, 3]);
    });

    it('should handle comments in nested structures', () => {
      const pbxprojContent = `{
        /* Root comment */
        project = {
          // Project comment
          name = "TestProject";
          targets = (
            /* Target 1 comment */
            {
              name = "App";
              dependencies = (
                "Dependency1" /* inline comment */,
                "Dependency2"
              );
            }
            /* End target comment */
          );
        };
      }`;

      const result = parse(pbxprojContent);

      expect(result.project.name).toBe('TestProject');
      expect(result.project.targets[0].name).toBe('App');
      expect(result.project.targets[0].dependencies).toEqual([
        'Dependency1',
        'Dependency2',
      ]);
    });
  });
});
