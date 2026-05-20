'use client'

import katex from 'katex'

interface Props {
  latex: string
}

export default function KaTeXRendererImpl({ latex }: Props) {
  const html = katex.renderToString(latex, { throwOnError: false })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
