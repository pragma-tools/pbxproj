/**
 * Parse .pbxproj (Property List ASCII format) content
 *
 * BNF Grammar for plist ASCII format:
 * plist      := assignment*
 * assignment := key "=" value ";"
 * value      := dictionary | array | string | number
 * dictionary := "{" assignment* "}"
 * array      := "(" (value ("," value)*)? ")"
 * string     := quoted_string | unquoted_string
 * key        := string
 * number     := digit+
 */

export function parse(pbxprojText, options = {}) {
  // eslint-disable-next-line no-unused-vars
  const { preserveComments = false } = options;

  // Tokenizer
  class Tokenizer {
    constructor(text) {
      this.text = text;
      this.pos = 0;
      this.length = text.length;
    }

    skipWhitespace() {
      while (this.pos < this.length && /\s/.test(this.text[this.pos])) {
        this.pos++;
      }
    }

    skipComment() {
      if (this.peek(2) === '/*') {
        this.pos += 2;
        while (this.pos < this.length - 1) {
          if (this.text[this.pos] === '*' && this.text[this.pos + 1] === '/') {
            this.pos += 2;
            break;
          }
          this.pos++;
        }
      } else if (this.peek(2) === '//') {
        this.pos += 2;
        while (this.pos < this.length && this.text[this.pos] !== '\n') {
          this.pos++;
        }
      }
    }

    skipWhitespaceAndComments() {
      while (this.pos < this.length) {
        const oldPos = this.pos;
        this.skipWhitespace();
        this.skipComment();
        if (this.pos === oldPos) break;
      }
    }

    peek(count = 1) {
      return this.text.slice(this.pos, this.pos + count);
    }

    advance(count = 1) {
      this.pos += count;
    }

    isAtEnd() {
      return this.pos >= this.length;
    }

    readQuotedString() {
      if (this.text[this.pos] !== '"') {
        throw new Error(`Expected quote at position ${this.pos}`);
      }

      this.pos++; // skip opening quote
      let result = '';

      while (this.pos < this.length && this.text[this.pos] !== '"') {
        if (this.text[this.pos] === '\\') {
          this.pos++; // skip escape
          if (this.pos >= this.length) break;

          const escaped = this.text[this.pos];
          switch (escaped) {
            case 'n':
              result += '\n';
              break;
            case 't':
              result += '\t';
              break;
            case 'r':
              result += '\r';
              break;
            case '\\':
              result += '\\';
              break;
            case '"':
              result += '"';
              break;
            default:
              result += escaped;
              break;
          }
        } else {
          result += this.text[this.pos];
        }
        this.pos++;
      }

      if (this.pos < this.length && this.text[this.pos] === '"') {
        this.pos++; // skip closing quote
      }

      return result;
    }

    readUnquotedString() {
      let result = '';

      while (this.pos < this.length) {
        const char = this.text[this.pos];
        if (/[a-zA-Z0-9_.$/-]/.test(char)) {
          result += char;
          this.pos++;
        } else {
          break;
        }
      }

      return result;
    }

    readString() {
      if (this.text[this.pos] === '"') {
        return this.readQuotedString();
      } else {
        return this.readUnquotedString();
      }
    }

    readNumber() {
      let result = '';

      if (this.text[this.pos] === '-') {
        result += '-';
        this.pos++;
      }

      while (this.pos < this.length && /\d/.test(this.text[this.pos])) {
        result += this.text[this.pos];
        this.pos++;
      }

      if (this.pos < this.length && this.text[this.pos] === '.') {
        result += '.';
        this.pos++;
        while (this.pos < this.length && /\d/.test(this.text[this.pos])) {
          result += this.text[this.pos];
          this.pos++;
        }
      }

      return parseFloat(result);
    }
  }

  // Parser
  class Parser {
    constructor(tokenizer) {
      this.tokenizer = tokenizer;
    }

    parseValue() {
      this.tokenizer.skipWhitespaceAndComments();

      if (this.tokenizer.isAtEnd()) {
        return null;
      }

      const char = this.tokenizer.peek();

      if (char === '{') {
        return this.parseDictionary();
      } else if (char === '(') {
        return this.parseArray();
      } else if (char === '"' || /[a-zA-Z0-9_.$/-]/.test(char)) {
        const value = this.tokenizer.readString();

        // Try to parse as number if it looks like one
        if (/^-?\d+(\.\d+)?$/.test(value)) {
          return parseFloat(value);
        }

        return value;
      } else if (/\d|-/.test(char)) {
        return this.tokenizer.readNumber();
      } else {
        throw new Error(
          `Unexpected character '${char}' at position ${this.tokenizer.pos}`,
        );
      }
    }

    parseDictionary() {
      this.tokenizer.skipWhitespaceAndComments();

      if (this.tokenizer.peek() !== '{') {
        throw new Error(`Expected '{' at position ${this.tokenizer.pos}`);
      }

      this.tokenizer.advance(); // skip '{'
      const dict = {};

      while (true) {
        this.tokenizer.skipWhitespaceAndComments();

        if (this.tokenizer.isAtEnd()) {
          throw new Error('Unexpected end of input while parsing dictionary');
        }

        if (this.tokenizer.peek() === '}') {
          this.tokenizer.advance();
          break;
        }

        // Parse key
        const key = this.tokenizer.readString();

        this.tokenizer.skipWhitespaceAndComments();

        if (this.tokenizer.peek() !== '=') {
          throw new Error(
            `Expected '=' after key '${key}' at position ${this.tokenizer.pos}`,
          );
        }

        this.tokenizer.advance(); // skip '='

        // Parse value
        const value = this.parseValue();
        dict[key] = value;

        this.tokenizer.skipWhitespaceAndComments();

        if (this.tokenizer.peek() === ';') {
          this.tokenizer.advance(); // skip ';'
        }
      }

      return dict;
    }

    parseArray() {
      this.tokenizer.skipWhitespaceAndComments();

      if (this.tokenizer.peek() !== '(') {
        throw new Error(`Expected '(' at position ${this.tokenizer.pos}`);
      }

      this.tokenizer.advance(); // skip '('
      const array = [];

      while (true) {
        this.tokenizer.skipWhitespaceAndComments();

        if (this.tokenizer.isAtEnd()) {
          throw new Error('Unexpected end of input while parsing array');
        }

        if (this.tokenizer.peek() === ')') {
          this.tokenizer.advance();
          break;
        }

        const value = this.parseValue();
        array.push(value);

        this.tokenizer.skipWhitespaceAndComments();

        if (this.tokenizer.peek() === ',') {
          this.tokenizer.advance(); // skip ','
        } else if (this.tokenizer.peek() === ')') {
          // Allow trailing comma or no comma before closing
          continue;
        }
      }

      return array;
    }

    parse() {
      this.tokenizer.skipWhitespaceAndComments();

      // Handle full plist format or just the root dictionary
      if (this.tokenizer.peek() === '{') {
        return this.parseDictionary();
      } else {
        // Parse as root-level assignments
        const root = {};

        while (!this.tokenizer.isAtEnd()) {
          this.tokenizer.skipWhitespaceAndComments();

          if (this.tokenizer.isAtEnd()) break;

          const key = this.tokenizer.readString();

          this.tokenizer.skipWhitespaceAndComments();

          if (this.tokenizer.peek() !== '=') {
            throw new Error(
              `Expected '=' after key '${key}' at position ${this.tokenizer.pos}`,
            );
          }

          this.tokenizer.advance(); // skip '='

          const value = this.parseValue();
          root[key] = value;

          this.tokenizer.skipWhitespaceAndComments();

          if (this.tokenizer.peek() === ';') {
            this.tokenizer.advance(); // skip ';'
          }
        }

        return root;
      }
    }
  }

  try {
    const tokenizer = new Tokenizer(pbxprojText);
    const parser = new Parser(tokenizer);
    const parsed = parser.parse();

    // Always ensure .pbxproj structure is complete
    return {
      archiveVersion: parsed.archiveVersion || null,
      objectVersion: parsed.objectVersion || null,
      objects: parsed.objects || {},
      rootObject: parsed.rootObject || null,
      classes: parsed.classes || {},
      ...parsed, // Override with any additional fields that might exist
    };
  } catch (error) {
    throw new Error(`Failed to parse .pbxproj: ${error.message}`);
  }
}
