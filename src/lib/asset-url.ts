// Lovable asset paths are served by Lovable hosting, not third-party hosts.
const ASSET_ORIGIN = "https://pre-order-gys.lovable.app";

export function resolveAssetUrl(url: string): string {
  return url.startsWith("/__l5e/assets-v1/") ? `${ASSET_ORIGIN}${url}` : url;
}