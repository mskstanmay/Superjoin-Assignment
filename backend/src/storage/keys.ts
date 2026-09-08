import path from 'node:path';
// Keys are application-generated POSIX relative identifiers, not user paths.
export function resolveStorageKey(root: string, key: string): string {
  if (!/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.[A-Za-z0-9]+$/.test(key)) throw new Error('Invalid storage key');
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, key);
  const relative = path.relative(resolvedRoot, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Storage key escapes root');
  return target;
}
