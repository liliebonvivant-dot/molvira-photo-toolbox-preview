import type { Language } from './content';

/**
 * Public AGPL-3.0 source repository. Keep empty until a real public address exists:
 * while empty, no source-code link is rendered anywhere (no placeholder or broken link).
 */
export const sourceCodeUrl = 'https://github.com/liliebonvivant-dot/molvira-photo-toolbox-preview';

const labels: Record<Language, { link: string; notice: string }> = {
  en: { link: 'Source code (AGPL-3.0)', notice: 'MOLVIRA PHOTO is free software licensed under the GNU AGPL-3.0. You can obtain the complete corresponding source code of this site at the link below.' },
  pt: { link: 'Código-fonte (AGPL-3.0)', notice: 'O MOLVIRA PHOTO é software livre licenciado sob a GNU AGPL-3.0. Você pode obter o código-fonte correspondente completo deste site no link abaixo.' },
  es: { link: 'Código fuente (AGPL-3.0)', notice: 'MOLVIRA PHOTO es software libre con licencia GNU AGPL-3.0. Puede obtener el código fuente correspondiente completo de este sitio en el enlace siguiente.' },
};

export function sourceCode(lang: Language, url: string = sourceCodeUrl) {
  if (!/^https:\/\/\S+$/.test(url)) return null;
  return { url, ...labels[lang] };
}
