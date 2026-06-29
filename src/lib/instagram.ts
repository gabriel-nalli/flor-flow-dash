// Normaliza o que foi digitado no campo Instagram (vendedora/lead) numa URL de
// perfil válida. Cobre os casos reais do banco que quebravam o link:
//  - espaço no começo/fim (ex.: "Jessicasouzabeautyy ")  -> apara
//  - URL colada inteira (ex.: "https://www.instagram.com/foo/?igsh=...") -> usa direto
//  - "instagram.com/foo" sem protocolo -> adiciona https://
//  - "@foo" -> tira o @
//  - nome com espaços no meio -> usa o 1º token (melhor esforço)
export function instagramUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const v = raw.trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;
  if (/(^|\.)instagram\.com\//i.test(v)) return 'https://' + v.replace(/^\/+/, '');
  const handle = v.replace(/^@+/, '').trim().split(/\s+/)[0].replace(/\/+$/, '');
  return handle ? 'https://instagram.com/' + handle : undefined;
}

// Handle limpo para exibir (ex.: "@fulano"). Extrai de uma URL quando for o caso.
export function instagramHandle(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const v = raw.trim();
  if (!v) return undefined;
  const fromUrl = v.match(/instagram\.com\/([^/?#\s]+)/i);
  const handle = fromUrl ? fromUrl[1] : v.replace(/^@+/, '').trim().split(/\s+/)[0];
  return handle ? '@' + handle : undefined;
}
