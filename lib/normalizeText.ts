export function normalizeText(
  value: string | null | undefined
) {

  return (value || '')
    .normalize('NFD')

    // accents / tildes
    .replace(/[\u0300-\u036f]/g, '')

    // apostrophes
    .replace(/['’`]/g, '')

    // hyphens
    .replace(/-/g, ' ')

    // collapse multiple spaces
    .replace(/\s+/g, ' ')

    // trim
    .trim()

    // lowercase
    .toLowerCase()

}