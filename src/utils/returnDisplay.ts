const motives: Record<string, string> = {
  Dano_envio: 'Daño en envío', Arrepentimiento: 'Arrepentimiento',
  Defecto_fabrica: 'Defecto de fábrica', Error_producto: 'Producto incorrecto', Producto_equivocado: 'Producto incorrecto',
};
export function formatMotivo(value: unknown): string {
  const reason = typeof value === 'string' && value ? value : 'No especificado';
  return Object.hasOwn(motives, reason) ? motives[reason] : reason.replace(/_/g, ' ');
}
