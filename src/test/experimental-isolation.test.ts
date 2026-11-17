import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { rejectExperimentalRequest } from '@/lib/experimental-access';
import { tools } from '@/lib/photo/content';

describe('experimental isolation boundary', () => {
  it('denies direct prototype access independently of robots directives', () => {
    for (const path of ['/experimental/birefnet', '/experimental/birefnet/', '/experimental/birefnet?access=owner', '/experimental/%62irefnet']) {
      const response = rejectExperimentalRequest(new Request(`https://example.test${path}`));
      expect(response?.status).toBe(404);
      expect(response?.headers.get('cache-control')).toBe('no-store');
    }
  });
  it('denies the experimental runtime path', () => {
    expect(rejectExperimentalRequest(new Request('https://example.test/experimental/birefnet/ort-wasm-simd-threaded.mjs'))?.status).toBe(404);
    expect(existsSync(resolve('public/experimental/birefnet/ort-wasm-simd-threaded.mjs'))).toBe(false);
    expect(existsSync(resolve('.lovable/experiments/birefnet/runtime-notices/ort-wasm-simd-threaded.mjs'))).toBe(true);
  });
  it('preserves access to all six existing processors', () => {
    for (const slug of ['resize-images', 'crop-rotate-images', 'convert-images', 'compress-images', 'add-watermark', 'remove-image-background']) {
      expect(rejectExperimentalRequest(new Request(`https://example.test/en/${slug}`))).toBeUndefined();
    }
  });
  it('excludes the experiment from the public sitemap inventory', () => {
    const xml = readFileSync(resolve('public/sitemap.xml'), 'utf8');
    expect(xml.match(/<loc>[^<]*experimental[^<]*<\/loc>/g) ?? []).toHaveLength(0);
  });
  it('keeps the authorized thirteen-tool catalog without experimental identity', () => {
    expect(tools).toHaveLength(13);
    expect(JSON.stringify(tools)).not.toMatch(/birefnet|experimental/i);
  });
  it('detaches experimental processing imports from every route', () => {
    const files = readdirSync(resolve('src/routes')).filter(file => file.endsWith('.tsx'));
    for (const file of files) {
      const route = readFileSync(resolve('src/routes', file), 'utf8');
      expect(route).not.toMatch(/(?:from\s*|import\s*\()['"][^'"]*(?:birefnet|ort-birefnet)/);
    }
  });
});