// This production branch only publishes the website. The inquiry backend has
// a separate operational acceptance process and must never enter this package.
export function assertStaticFiles(files) {
  if (files.some(file => /(?:^|\/)(?:api|_inquiry|backend|webbyu-private)(?:\/|$)|\.(?:php|ini|log|map)$|(?:^|\/)(?:\.env(?:\..*)?|private-config[^/]*|inquiry-state\.json|auth\.json|composer\.(?:json|lock))$/i.test(file))) {
    throw new Error('Backend, private or development file in static release.');
  }
}
