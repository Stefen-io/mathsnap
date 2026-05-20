import dynamic from 'next/dynamic'

const KaTeXRenderer = dynamic(() => import('./KaTeXRendererImpl'), { ssr: false })

export default KaTeXRenderer
