import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, X, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { chatResponses, defaultChatResponse } from '@/lib/ai-data'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const suggestedQuestions = [
  'Quanto devo comprar amanhã?',
  'Qual ingrediente gera maior desperdício?',
  'Qual prato possui maior margem?',
  'Quanto vou faturar nesta semana?',
]

function getResponse(question: string): string {
  const normalized = question.toLowerCase().trim()
  for (const [key, value] of Object.entries(chatResponses)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value
    }
  }
  if (normalized.includes('comprar') || normalized.includes('compra')) {
    return chatResponses['quanto devo comprar amanha']
  }
  if (normalized.includes('desperdic') || normalized.includes('desperdício')) {
    return chatResponses['qual ingrediente gera maior desperdicio']
  }
  if (normalized.includes('margem') || normalized.includes('lucro')) {
    return chatResponses['qual prato possui maior margem']
  }
  if (
    normalized.includes('faturar') ||
    normalized.includes('faturamento') ||
    normalized.includes('semana')
  ) {
    return chatResponses['quanto vou faturar nesta semana']
  }
  return defaultChatResponse
}

export function AiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou o assistente Oniceli AI. Posso analisar seu estoque, finanças e operação em tempo real. Como posso ajudar?',
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const response = getResponse(trimmed)
      setMessages((prev) => [...prev, { role: 'assistant', content: response }])
      setIsTyping(false)
    }, 800)
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-20 right-4 md:bottom-6 z-40 rounded-full h-14 w-14 p-0 shadow-lg bg-emerald-600 hover:bg-emerald-700 transition-transform hover:scale-105',
          isOpen && 'hidden',
        )}
      >
        <Sparkles className="h-6 w-6" />
        <span className="sr-only">Abrir Assistente IA</span>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-200" />
        </span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-end sm:justify-end p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full sm:w-96 h-[80vh] sm:h-[600px] bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between p-4 border-b bg-emerald-600 text-white">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-white/20 p-1.5">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Oniceli AI Assistant</h3>
                  <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    Online · Analisando dados em tempo real
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 shrink-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex gap-2 max-w-[90%]',
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : '',
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="rounded-full bg-emerald-100 p-1.5 shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'rounded-xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-muted text-foreground',
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2">
                    <div className="rounded-full bg-emerald-100 p-1.5 shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="rounded-xl bg-muted px-4 py-3 flex gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-[11px] px-2.5 py-1.5 rounded-full bg-muted hover:bg-emerald-100 hover:text-emerald-700 transition-colors text-muted-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend(input)
                }}
                placeholder="Pergunte sobre sua operação..."
                className="flex-1 rounded-full bg-muted px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Button
                size="icon"
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 shrink-0"
                onClick={() => handleSend(input)}
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
