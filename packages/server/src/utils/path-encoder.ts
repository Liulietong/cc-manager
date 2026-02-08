export function encodePath(filePath: string): string {
  return filePath.replace(/[\/\\]/g, '-').replace(/[:]/g, '');
}

export function decodePath(encodedPath: string): string {
  return encodedPath.replace(/-/g, '/');
}
