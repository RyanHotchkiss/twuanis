export class PropertyAccountChanged extends Error {constructor(){super('Account changed during the operation');this.name='PropertyAccountChanged'}}
export class PropertyAuthenticationRequired extends Error {
  constructor() { super('Authentication required'); this.name = 'PropertyAuthenticationRequired' }
}
export function propertyInteractionMessage(error: unknown, language: 'en'|'es', fallback?: string) {
  if (error instanceof PropertyAuthenticationRequired) return language === 'es' ? 'Inicie sesión para guardar propiedades y notas.' : 'Sign in to save properties and notes.'
  return fallback ?? (language === 'es' ? 'No se pudo guardar el cambio. Inténtelo de nuevo.' : 'The change could not be saved. Please try again.')
}
export function propertySignIn(language: 'en'|'es') {
  window.location.assign('/login?lang=' + language + '&next=' + encodeURIComponent(window.location.pathname + window.location.search))
}
