import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {'/*': ['./server-archives/*.cjs','./server-archives/*.json'], '/api/staging/remates-retrieval-diagnostic': ['./lib/remates/adapters/pdf-worker.mjs','./node_modules/pdfjs-dist/legacy/build/*.mjs','./node_modules/pdfjs-dist/package.json','./node_modules/@napi-rs/canvas/**/*','./node_modules/@napi-rs/canvas-*/*'], '/api/cron/remates-retrieval': ['./lib/remates/adapters/pdf-worker.mjs','./node_modules/pdfjs-dist/legacy/build/*.mjs','./node_modules/pdfjs-dist/package.json','./node_modules/@napi-rs/canvas/**/*','./node_modules/@napi-rs/canvas-*/*'], '/api/remates/adapters/pdf': ['./lib/remates/adapters/pdf-worker.mjs','./node_modules/pdfjs-dist/legacy/build/*.mjs','./node_modules/pdfjs-dist/package.json','./node_modules/@napi-rs/canvas/**/*','./node_modules/@napi-rs/canvas-*/*']},
  allowedDevOrigins: [
    '192.168.31.161'
  ],
  async headers(){return [...(process.env.NEXT_PUBLIC_TWUANIS_ENVIRONMENT === 'staging' ? [{source:'/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}]}] : []),{source:'/auth/callback',headers:[{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Robots-Tag',value:'noindex, nofollow'}]}]}
}

export default nextConfig