'use client'

import dynamic from 'next/dynamic'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface KaTeXRendererProps {
  latex: string
}

function KaTeXRendererInner({ latex }: KaTeXRendererProps) {
  let html = ''
  try {
    html = katex.renderToString(latex, { throwOnError: false, displayMode: false })
  } catch {
    html = latex
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

const KaTeXRenderer = dynamic(() => Promise.resolve(KaTeXRendererInner), { ssr: false })

export default KaTeXRenderer
