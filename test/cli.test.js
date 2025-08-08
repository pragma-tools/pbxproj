import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';

describe('CLI', () => {
  it('should show usage when no arguments provided', () => {
    try {
      execSync('node src/cli.js', { encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
      expect(error.stderr).toContain('Usage: pbxproj');
      expect(error.status).toBe(1);
    }
  });

  it('should process sample.pbxproj file', () => {
    const result = execSync('node src/cli.js test/sample.pbxproj', {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    expect(result).toContain('archiveVersion = 1;');
    expect(result).toContain('objectVersion = 56;');
    expect(result).toContain('objects = {');
    expect(result).toContain('rootObject = 1A2B3C4D5E6F7890ABCDEF06;');
  });

  it('should handle non-existent file gracefully', () => {
    try {
      execSync('node src/cli.js nonexistent.pbxproj', {
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      expect(error.status).not.toBe(0);
    }
  });

  it('should be executable', () => {
    const stats = fs.statSync('./src/cli.js');
    const isExecutable = !!(stats.mode & parseInt('111', 8));
    expect(isExecutable).toBe(true);
  });

  it('should have correct shebang', () => {
    const content = fs.readFileSync('./src/cli.js', 'utf8');
    expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
  });
});
