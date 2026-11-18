/** Preserve the catalog and processor; licensing hold denies all public execution. */
export function isToolAvailable(id: string) {
  return id !== 'remove-background';
}
export function isUnavailablePath(path: string) {
  try {
    const decoded = decodeURIComponent(path).replace(/\/+$/, '');
    return /^\/(en\/remove-image-background|pt\/remover-fundo-de-imagem|es\/eliminar-fondo-de-imagen)$/.test(decoded);
  } catch { return false; }
}