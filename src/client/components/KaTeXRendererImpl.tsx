'use client'

import katex from 'katex'
import "katex/dist/katex.min.css"

interface Props {
  latex: string
}

export default function KaTeXRendererImpl({ latex }: Props) {
	const html = katex.renderToString(latex, {
		throwOnError: false,
		displayMode: true,
	})
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
