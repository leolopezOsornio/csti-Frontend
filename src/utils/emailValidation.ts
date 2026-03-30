export const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

export const checkEmailTypo = (email: string): string | null => {
  if (!email) return null;

  // 1. Validaciones iniciales
  const structuralRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!structuralRegex.test(email)) {
    return "Ingresa un formato de correo válido";
  }

  const parts = email.split('@');
  if (parts.length < 2) return "Ingresa un formato de correo válido"; 
  const domain = parts[1].toLowerCase();

  const domainParts = domain.split('.');
  const provider = domainParts[0];
  const tld = domainParts.slice(1).join('.');

  const publicProviders = ['gmail', 'hotmail', 'outlook', 'yahoo'];
  const commonProviders = [...publicProviders, 'icloud', 'live', 'msn', 'aol', 'fasterclick'];
  const commonTLDs = ['com', 'mx', 'es', 'edu.mx', 'org', 'net', 'online', 'info', 'site', 'co'];

  // Fase de Resolución (Descubrir intenciones)
  let resolvedProvider: string | null = null;
  if (commonProviders.includes(provider)) {
    resolvedProvider = provider;
  } else {
    for (const knownProvider of commonProviders) {
      const distance = getLevenshteinDistance(provider, knownProvider);
      if (distance >= 1 && distance <= 2) {
        resolvedProvider = knownProvider;
        break;
      }
    }
  }

  let resolvedTLD: string | null = null;
  if (commonTLDs.includes(tld)) {
    resolvedTLD = tld;
  } else {
    for (const knownTLD of commonTLDs) {
      const distance = getLevenshteinDistance(tld, knownTLD);
      if (distance >= 1 && distance <= 2) {
        resolvedTLD = knownTLD;
        break;
      }
    }
  }

  // Reglas de Sentencia (Orden exacto)

  // Regla A: Proveedores Públicos Estrictos
  // Evaluamos si el proveedor (original o resuelto) es público
  const isPublicProvider = publicProviders.includes(resolvedProvider || provider);
  if (isPublicProvider) {
    // Si el TLD no es común o es el caso especial 'co', sugerimos .com
    if (!commonTLDs.includes(tld) || tld === 'co') {
      return `¿Quisiste decir @${resolvedProvider || provider}.com?`;
    }
  }

  // Regla B: Corrección de Custom Domains (TLD)
  if (resolvedTLD && resolvedTLD !== tld) {
    return `Parece un error tipográfico. ¿Quisiste decir .${resolvedTLD}?`;
  }

  // Regla C: Corrección de Proveedor válido con TLD válido
  if (commonTLDs.includes(tld) && resolvedProvider && resolvedProvider !== provider) {
    return `¿Quisiste decir @${resolvedProvider}.${tld}?`;
  }

  // Salida por defecto: Dominio válido o totalmente desconocido (corporativo)
  return null;
};
