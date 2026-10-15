export async function register() {
  const { assertStagingServerEnvironment } = await import('./lib/staging-server-guard')
  assertStagingServerEnvironment()
}
