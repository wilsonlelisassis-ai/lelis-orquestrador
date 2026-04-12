/* QuadroRico — Renderiza conteúdo rico no quadro do chat AVATEA
 * Suporta: markdown, equações LaTeX (KaTeX), código com syntax highlight, imagens geradas por IA
 */
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'

interface QuadroRicoProps {
  content: string
  imageUrl?: string | null
  isLoading?: boolean
  onImageError?: () => void
}

export function QuadroRico({ content, imageUrl, isLoading, onImageError }: QuadroRicoProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-3">
        <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span style={{ color: '#6b7280', fontSize: '1.1rem', fontFamily: 'Source Sans 3, sans-serif' }}>
          Sofia está pensando...
        </span>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center">
          <span style={{ fontSize: '2rem' }}>📚</span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '1.1rem', lineHeight: '1.7', fontFamily: 'Source Sans 3, sans-serif' }}>
          Olá! Sou a <strong style={{ color: '#0ea5e9' }}>Dra. Sofia</strong>.<br />
          Faça sua pergunta e a resposta aparecerá aqui no quadro.<br />
          Você pode enviar texto, usar o microfone ou anexar arquivos.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Conteúdo rico com markdown + LaTeX */}
      <div
        className="quadro-rico-content"
        style={{ fontFamily: 'Source Sans 3, sans-serif', color: '#1a1a2e' }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            // Títulos
            h1: ({ children }) => (
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0c4a6e', marginBottom: '0.5rem', fontFamily: 'Nunito, sans-serif' }}>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0369a1', marginBottom: '0.4rem', fontFamily: 'Nunito, sans-serif' }}>
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0284c7', marginBottom: '0.3rem', fontFamily: 'Nunito, sans-serif' }}>
                {children}
              </h3>
            ),
            // Parágrafo
            p: ({ children }) => (
              <p style={{ fontSize: '1.15rem', lineHeight: '1.8', marginBottom: '0.75rem', color: '#1a1a2e' }}>
                {children}
              </p>
            ),
            // Listas
            ul: ({ children }) => (
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem', listStyleType: 'disc' }}>
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem', listStyleType: 'decimal' }}>
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '0.25rem', color: '#1a1a2e' }}>
                {children}
              </li>
            ),
            // Negrito e itálico
            strong: ({ children }) => (
              <strong style={{ fontWeight: 700, color: '#0c4a6e' }}>{children}</strong>
            ),
            em: ({ children }) => (
              <em style={{ fontStyle: 'italic', color: '#374151' }}>{children}</em>
            ),
            // Código inline
            code: ({ children, className }) => {
              const isBlock = className?.startsWith('language-')
              if (isBlock) {
                const lang = className?.replace('language-', '') || 'text'
                return (
                  <div style={{ marginBottom: '0.75rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{ background: '#f1f5f9', padding: '4px 12px', fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', borderBottom: '1px solid #e2e8f0' }}>
                      {lang}
                    </div>
                    <SyntaxHighlighter
                      language={lang}
                      style={oneLight}
                      customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.9rem' }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                )
              }
              return (
                <code style={{
                  background: '#f1f5f9',
                  color: '#0369a1',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.9em',
                  fontFamily: 'monospace',
                }}>
                  {children}
                </code>
              )
            },
            // Bloco de código (pre)
            pre: ({ children }) => <>{children}</>,
            // Blockquote
            blockquote: ({ children }) => (
              <blockquote style={{
                borderLeft: '4px solid #38bdf8',
                paddingLeft: '1rem',
                margin: '0.75rem 0',
                background: '#f0f9ff',
                borderRadius: '0 8px 8px 0',
                padding: '0.5rem 1rem',
                color: '#0369a1',
                fontStyle: 'italic',
              }}>
                {children}
              </blockquote>
            ),
            // Linha horizontal
            hr: () => (
              <hr style={{ border: 'none', borderTop: '2px solid #e2e8f0', margin: '1rem 0' }} />
            ),
            // Tabela
            table: ({ children }) => (
              <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th style={{ background: '#0369a1', color: 'white', padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#1a1a2e' }}>
                {children}
              </td>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Imagem gerada por IA */}
      {imageUrl && (
        <div style={{ marginTop: '0.5rem' }}>
          <img
            src={imageUrl}
            alt="Ilustração gerada pela IA"
            style={{
              width: '100%',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              maxHeight: '260px',
              objectFit: 'contain',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
            onError={onImageError}
          />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px', textAlign: 'center', fontFamily: 'Source Sans 3, sans-serif' }}>
            Ilustração gerada pela IA
          </p>
        </div>
      )}
    </div>
  )
}
