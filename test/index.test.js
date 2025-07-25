import { describe, it, expect } from 'vitest';
import { parse, serialize, stringify, build } from '../src/index.js';

describe('Main Module', () => {
  it('should export parse function', () => {
    expect(typeof parse).toBe('function');
  });

  it('should export serialize function', () => {
    expect(typeof serialize).toBe('function');
  });

  it('should export stringify function', () => {
    expect(typeof stringify).toBe('function');
  });

  it('should export build function (legacy alias)', () => {
    expect(typeof build).toBe('function');
  });

  it('should have parse function that works', () => {
    const input = 'archiveVersion = 1;\nobjectVersion = 56;';
    const result = parse(input);
    
    expect(result).toHaveProperty('archiveVersion');
    expect(result).toHaveProperty('objectVersion');
    expect(result).toHaveProperty('objects');
    expect(result).toHaveProperty('rootObject');
  });

  it('should have serialize function that works', () => {
    const ast = {
      archiveVersion: 1,
      objectVersion: 56,
      objects: {},
      rootObject: 'ABC123',
    };
    
    const result = serialize(ast);
    
    expect(typeof result).toBe('string');
    expect(result).toContain('archiveVersion = 1;');
    expect(result).toContain('objectVersion = 56;');
  });

  it('should have stringify function that works', () => {
    const ast = {
      archiveVersion: 1,
      objectVersion: 56,
      objects: {},
      rootObject: 'ABC123',
    };
    
    const result = stringify(ast);
    
    expect(typeof result).toBe('string');
    expect(result).toContain('archiveVersion = 1;');
    expect(result).toContain('objectVersion = 56;');
  });

  it('should have build function (legacy alias) that works', () => {
    const ast = {
      archiveVersion: 1,
      objectVersion: 56,
      objects: {},
      rootObject: 'ABC123',
    };
    
    const result = build(ast);
    
    expect(typeof result).toBe('string');
    expect(result).toContain('archiveVersion = 1;');
    expect(result).toContain('objectVersion = 56;');
  });

  it('should have serialize, stringify, and build return identical results', () => {
    const ast = {
      archiveVersion: 1,
      objectVersion: 56,
      objects: {},
      rootObject: 'ABC123',
    };
    
    const serializeResult = serialize(ast);
    const stringifyResult = stringify(ast);
    const buildResult = build(ast);
    
    expect(serializeResult).toBe(stringifyResult);
    expect(serializeResult).toBe(buildResult);
  });
}); 