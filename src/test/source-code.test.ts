import { describe, expect, it } from 'vitest';
import { sourceCode, sourceCodeUrl } from '@/lib/photo/source-code';
describe('AGPL source-code link', () => {
  it('points to the public repository in all three languages', () => {
    expect(sourceCodeUrl).toBe('https://github.com/liliebonvivant-dot/molvira-photo-toolbox-preview');
    expect(sourceCode('en')?.url).toBe(sourceCodeUrl);
    expect(sourceCode('pt')?.url).toBe(sourceCodeUrl);
    expect(sourceCode('es')?.url).toBe(sourceCodeUrl);
  });
  it('rejects non-https or placeholder addresses', () => {
    expect(sourceCode('pt', 'http://x.dev')).toBeNull();
    expect(sourceCode('pt', '<repo-url>')).toBeNull();
  });
  it('appears in all three languages once a valid address is set', () => {
    const url = 'https://github.com/example/molvira-photo';
    expect(sourceCode('en', url)?.link).toBe('Source code (AGPL-3.0)');
    expect(sourceCode('pt', url)?.link).toBe('Código-fonte (AGPL-3.0)');
    expect(sourceCode('es', url)?.link).toBe('Código fuente (AGPL-3.0)');
  });
});
