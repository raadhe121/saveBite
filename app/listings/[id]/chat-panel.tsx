'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/lib/actions/messages'
import type { Message } from '@/lib/types'

export function ChatPanel({
  listingId,
  currentUserId,
  otherUserName,
  initialMessages,
}: {
  listingId: string
  currentUserId: string
  otherUserName: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Message timestamps are formatted with the viewer's local time zone, which
  // the server can't know — rendering them only after mount avoids a
  // server/client markup mismatch (hydration error) from toLocaleTimeString.
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only mount flag
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages-${listingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `listing_id=eq.${listingId}` },
        (payload) => {
          const row = payload.new as Message
          setMessages((current) => (current.some((m) => m.id === row.id) ? current : [...current, row]))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listingId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  function handleSend() {
    const text = draft.trim()
    if (!text) return
    setError(null)
    setDraft('')
    startTransition(async () => {
      try {
        await sendMessage(listingId, text)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not send message')
      }
    })
  }

  return (
    <div className="panel mt-4">
      <p className="eyebrow">Message {otherUserName}</p>

      <div ref={scrollRef} className="chat-thread mt-3">
        {messages.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            No messages yet. Coordinate pickup time and details here.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId
          return (
            <div key={m.id} className={`chat-bubble-row ${mine ? 'chat-bubble-row-mine' : ''}`}>
              <div className={`chat-bubble ${mine ? 'chat-bubble-mine' : ''}`}>
                <p>{m.body}</p>
                <span className="chat-bubble-time">
                  {mounted
                    ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ' '}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {error && <p className="banner banner-error mt-2">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Type a message…"
          className="input"
          maxLength={1000}
        />
        <button onClick={handleSend} disabled={isPending || !draft.trim()} className="btn btn-primary btn-sm">
          Send
        </button>
      </div>
    </div>
  )
}
