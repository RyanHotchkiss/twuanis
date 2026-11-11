import {load} from 'cheerio'

/** Presentation only: canonical input is never mutated or treated as executable HTML. */
export function descriptionText(value: unknown): string {
  if (typeof value !== 'string') return ''
  const paths: string[] = []
  const protectedText = value.replace(/[A-Za-z]:\\[^\s<>]+/g, path => {paths.push(path); return `TWUANISPATH${paths.length-1}TOKEN`})
  const text = protectedText.replace(/&lt;(br\s*\/?|\/?p|\/?div)&gt;/gi,'<$1>').replace(/\\r\\n|\\n|\\r/gi, '\n').replace(/\r\n?/g, '\n')
  const $ = load(text, {scriptingEnabled: false}, false)
  $('script,style,template,iframe,object,noscript').remove()
  $('br').replaceWith('\n')
  $('p,div,section,article,blockquote,h1,h2,h3,h4,h5,h6,ul,ol').each((_i, el) => {$(el).before('\n\n');$(el).after('\n\n')})
  $('li').each((_i, el) => {$(el).before('\n• ');$(el).after('\n')})
  return $.root().text().replace(/\u00a0/g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim().replace(/TWUANISPATH(\d+)TOKEN/g,(_m,n)=>paths[Number(n)] ?? '')
}
export function attributeValues(value: unknown, depth=0): string[] {
  if (depth>4 || value===null || value===undefined) return []
  if (Array.isArray(value)) return value.flatMap(item=>attributeValues(item,depth+1))
  if (typeof value==='number') return Number.isFinite(value) ? [String(value)] : []
  if (typeof value==='boolean') return [String(value)]
  if (typeof value!=='string') return []
  const text=value.trim(); if (!text) return []
  if (/^[\[{]/.test(text)) {try {return attributeValues(JSON.parse(text),depth+1)} catch {return [text]}}
  return [text]
}
