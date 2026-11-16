import { convertCopy } from './convert-copy';
import type { Language } from './content';

export const savingCopy = {
  en: { ...convertCopy.en, ready: 'File ready to save. The preview does not mean it has been downloaded.', openFile: 'Open image file', shareFile: 'Save / share file', saveError: 'The browser could not save/share the file. Open the image file below and save it from there.' },
  pt: { ...convertCopy.pt, ready: 'Arquivo pronto para salvar. A prévia não significa que ele foi baixado.', openFile: 'Abrir arquivo de imagem', shareFile: 'Salvar / compartilhar arquivo', saveError: 'O navegador não conseguiu salvar/compartilhar o arquivo. Abra o arquivo de imagem abaixo e salve por lá.' },
  es: { ...convertCopy.es, ready: 'Archivo listo para guardar. La vista previa no significa que se haya descargado.', openFile: 'Abrir archivo de imagen', shareFile: 'Guardar / compartir archivo', saveError: 'El navegador no pudo guardar/compartir el archivo. Abre el archivo de imagen abajo y guárdalo desde allí.' },
} satisfies Record<Language, typeof convertCopy.en>;