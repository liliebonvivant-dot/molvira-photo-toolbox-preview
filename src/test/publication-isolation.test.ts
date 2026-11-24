import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isToolAvailable, isUnavailablePath } from '@/lib/photo/availability';
import { adsTxt } from '@/lib/site-config';

describe('authorized public release boundaries', () => {
  it('registers the existing background editor publicly in all three languages', () => {
    const source = readFileSync('src/components/photo/workspace.tsx', 'utf8');
    expect(source).toMatch(/import[^;]*['"]\.\/background-workspace['"]/);
    expect(isToolAvailable('remove-background')).toBe(true);
    for (const path of ['/en/remove-image-background', '/pt/remover-fundo-de-imagem', '/es/eliminar-fondo-de-imagen']) {
      expect(isUnavailablePath(path)).toBe(false);
    }
  });
  it('serves only the authorized ads.txt line while ads stay disabled', () => {
    expect(adsTxt()).toBe('google.com, pub-2354052146318758, DIRECT, f08c47fec0942fa0\n');
  });
});