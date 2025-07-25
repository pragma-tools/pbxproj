import { describe, it, expect } from 'vitest';
import { generateComment } from '../src/comments.js';

describe('generateComment', () => {
  it('should prioritize path over other properties', () => {
    const object = {
      path: 'AppDelegate.swift',
      name: 'App Delegate',
      isa: 'PBXFileReference',
    };

    const result = generateComment(object);

    expect(result).toBe('AppDelegate.swift');
  });

  it('should use name if path is not available', () => {
    const object = {
      name: 'App Delegate',
      isa: 'PBXFileReference',
    };

    const result = generateComment(object);

    expect(result).toBe('App Delegate');
  });

  it('should use isa if neither path nor name are available', () => {
    const object = {
      isa: 'PBXFileReference',
      someOtherProperty: 'value',
    };

    const result = generateComment(object);

    expect(result).toBe('PBXFileReference');
  });

  it('should return "Object" if no relevant properties are available', () => {
    const object = {
      someProperty: 'value',
      anotherProperty: 123,
    };

    const result = generateComment(object);

    expect(result).toBe('Object');
  });

  it('should handle empty object', () => {
    const object = {};

    const result = generateComment(object);

    expect(result).toBe('Object');
  });

  it('should handle null/undefined values', () => {
    const object = {
      path: null,
      name: undefined,
      isa: 'PBXBuildFile',
    };

    const result = generateComment(object);

    expect(result).toBe('PBXBuildFile');
  });

  it('should handle empty strings', () => {
    const object = {
      path: '',
      name: '',
      isa: 'PBXGroup',
    };

    const result = generateComment(object);

    expect(result).toBe('PBXGroup');
  });
}); 