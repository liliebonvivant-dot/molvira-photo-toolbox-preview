import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isToolAvailable, isUnavailablePath } from '@/lib/photo/availability';
import { adsTxt } from '@/lib/site-config';

describe('authorized public release boundaries', () => {
  it('keeps the licensing-held background editor out of the public workspace imports', () => {
    const source = readFileSync('src/components/photo/workspace.tsx', 'utf8');
    expect(source).not.toMatch(/import[^;]*['"]\.\/background-workspace['"]/);
    expect(isToolAvailable('remove-background')).toBe(false);
    for (const path of ['/en/remove-image-background', '/pt/remover-fundo-de-imagem', '/es/eliminar-fondo-de-imagen']) {
      expect(isUnavailablePath(path)).toBe(true);
    }
  });
  it('keeps AdSense disabled for the approved release', () => {
    expect(adsTxt()).toBeNull();
  });
});