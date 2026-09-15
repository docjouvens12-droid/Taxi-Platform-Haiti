export function destinationLines(value: string, context: string) {
  const lines = value.split('\n').map(line => line.trim()).filter(Boolean)
  let street = lines.length > 1 ? lines.slice(1).join(' ') : value.trim()
  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  for (const part of context.split(',').map(part => part.trim())) {
    const pattern = escape(part).replace(/-/g, '[- ]').replace(/ï/g, '[iï]').replace(/é/g, '[eé]')
    street = street.replace(new RegExp(`(?:^|[,\\s]+)${pattern}(?=$|[,\\s])`, 'gi'), ' ')
  }
  street = street.replace(/\s+/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '')
  street = street.replace(/^(\d+[a-z]?)\s*,?\s+(.+)$/i, '$1, $2')
  street = street.replace(/(^|,\s*)(\p{L})/gu, (_, prefix, letter) => prefix + letter.toLocaleUpperCase('fr'))
  return { city: context, street }
}
