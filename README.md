# pragma-pbxproj

Parser and builder for .pbxproj files with comment strategies

## Installation

```bash
npm install @pragma.tools/pbxproj
```

## Usage

### Node.js API

```javascript
import { parse, serialize, stringify } from '@pragma.tools/pbxproj';
import fs from 'fs';

// Read .pbxproj file
const pbxprojContent = fs.readFileSync('MyApp.xcodeproj/project.pbxproj', 'utf8');

// Parse to AST
const ast = parse(pbxprojContent);

// Serialize back to .pbxproj format
const serialized = serialize(ast, { 
  commentStrategy: 'generate' // 'preserve', 'strip', 'generate', or custom function
});

// Or use stringify (alias for serialize)
const stringified = stringify(ast, { commentStrategy: 'generate' });

console.log(serialized);
```

## Examples

### Input .pbxproj file

```
// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 56;
	objects = {

/* Begin PBXBuildFile section */
		1A2B3C4D5E6F7890ABCDEF01 /* AppDelegate.swift in Sources */ = {
			isa = PBXBuildFile; 
			fileRef = 1A2B3C4D5E6F7890ABCDEF02 /* AppDelegate.swift */; 
		};
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
		1A2B3C4D5E6F7890ABCDEF02 /* AppDelegate.swift */ = {
			isa = PBXFileReference; 
			lastKnownFileType = sourcecode.swift; 
			path = AppDelegate.swift; 
			sourceTree = "<group>"; 
		};
/* End PBXFileReference section */

	};
	rootObject = 1A2B3C4D5E6F7890ABCDEF06 /* Project object */;
}
```

### Parsed AST (JSON)

```json
{
  "archiveVersion": 1,
  "objectVersion": 56,
  "objects": {
    "1A2B3C4D5E6F7890ABCDEF01": {
      "isa": "PBXBuildFile",
      "fileRef": "1A2B3C4D5E6F7890ABCDEF02"
    },
    "1A2B3C4D5E6F7890ABCDEF02": {
      "isa": "PBXFileReference",
      "lastKnownFileType": "sourcecode.swift",
      "path": "AppDelegate.swift",
      "sourceTree": "<group>"
    }
  },
  "rootObject": "1A2B3C4D5E6F7890ABCDEF06"
}
```

### Serialized .pbxproj with generated comments

```
archiveVersion = 1;
objectVersion = 56;
objects = {
  1A2B3C4D5E6F7890ABCDEF01 /* PBXBuildFile */ = {
    "isa" = "PBXBuildFile";
    "fileRef" = "1A2B3C4D5E6F7890ABCDEF02";
  };
  1A2B3C4D5E6F7890ABCDEF02 /* AppDelegate.swift */ = {
    "isa" = "PBXFileReference";
    "lastKnownFileType" = "sourcecode.swift";
    "path" = "AppDelegate.swift";
    "sourceTree" = "<group>";
  };
};
rootObject = 1A2B3C4D5E6F7890ABCDEF06;
```

### CLI

```bash
# Parse and rebuild with generated comments
pbxproj path/to/project.pbxproj

# Or using npx
npx @pragma.tools/pbxproj path/to/project.pbxproj
```

## Comment Strategies

- `preserve` - Keep original comments (default)
- `strip` - Remove all comments
- `generate` - Generate comments based on object properties
- Custom function - Provide your own comment generator

## API Reference

### `parse(pbxprojText, options = {})`
Parses .pbxproj file content into AST.

### `serialize(ast, options = {})`
Serializes AST back to .pbxproj format.

### `stringify(ast, options = {})`
Alias for `serialize` function.

### Legacy Support
- `build(ast, options = {})` - Legacy alias for `serialize`, maintained for backward compatibility

## Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests in watch mode
npm run test:watch
```

The project includes comprehensive tests covering:
- **Unit tests** - Individual function testing (`parse`, `build`, `generateComment`)
- **Integration tests** - Full parse-build cycle testing
- **CLI tests** - Command-line interface testing
- **Edge cases** - Error handling and boundary conditions

Test coverage includes:
- ✅ All main module exports
- ✅ Different comment strategies
- ✅ Error handling scenarios
- ✅ CLI argument validation
- ✅ File I/O operations

## Author

Denis Kreshikhin <denis@kreshikhin.com>

## License

MIT 