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
  it('serves only the authorized ads.txt line while ads stay disabled', () => {
    expect(adsTxt()).toBe('google.com, pub-2354052146318758, DIRECT, f08c47fec0942fa0\n');
  });
});