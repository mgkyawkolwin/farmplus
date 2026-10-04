const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  bmp: 'image/bmp',
};

export function normalizeMediaFile({
  uri,
  fileName,
  mimeType,
  assetType,
  fallbackName,
}: {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  assetType?: string | null;
  fallbackName: string;
}): { uri: string; name: string; type: string } {
  const cleanName = (fileName ?? '').trim() || `${fallbackName}-${Date.now()}.jpg`;

  const explicitMime = (mimeType ?? '').trim();
  if (explicitMime && explicitMime.includes('/')) {
    return { uri, name: cleanName, type: explicitMime };
  }

  const normalizedAssetType = (assetType ?? '').trim().toLowerCase();
  if (normalizedAssetType.includes('/')) {
    return { uri, name: cleanName, type: normalizedAssetType };
  }

  const extension = (uri.split('?')[0].split('.').pop() ?? '').toLowerCase();
  const guessedMime = MIME_BY_EXTENSION[extension] ?? 'image/jpeg';

  if (normalizedAssetType === 'image') {
    return { uri, name: cleanName, type: guessedMime };
  }

  return { uri, name: cleanName, type: guessedMime };
}
