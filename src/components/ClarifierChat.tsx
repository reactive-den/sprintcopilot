'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MessageSquare, Send, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ClarifierChatProps {
  sessionId: string;
  projectId: string;
}

export function ClarifierChat({ sessionId, projectId }: ClarifierChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoFinalizedRef = useRef(false);

  // Check if an assistant message actually contains a question (ends with ?)
  const isQuestion = (content: string) => {
    return content.trim().endsWith('?');
  };

  // Count questions asked by AI (excluding thank you messages)
  const questionCount = messages.filter(
    (msg) => msg.role === 'assistant' && isQuestion(msg.content)
  ).length;
  const maxQuestions = 5;
  const isQuestionLimitReached = questionCount >= maxQuestions;

  // Auto-finalize and create a run when question limit is reached
  useEffect(() => {
    if (
      questionCount >= maxQuestions &&
      messages.length > 0 &&
      !isLoading &&
      !isFinalizing &&
      !autoFinalizedRef.current
    ) {
      autoFinalizedRef.current = true;
      const finalizeAndRedirect = async () => {
        try {
          setIsFinalizing(true);
          const response = await fetch(`/api/clarifier/sessions/${sessionId}/finalize`, {
            method: 'POST',
          });

          if (response.ok) {
            const { clarifications } = await response.json();

            const runResponse = await fetch('/api/runs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId,
                clarifierSessionId: sessionId,
                clarifications,
              }),
            });

            if (runResponse.ok) {
              const runData = await runResponse.json();
              router.push(`/projects/${projectId}/business-document/${sessionId}`);
            } else {
              const error = await runResponse.json();
              alert(error.error || 'Failed to create run');
            }
          } else {
            const error = await response.json();
            alert(error.error || 'Failed to finalize clarifications');
          }
        } catch (error) {
          console.error('Failed to auto-finalize:', error);
        } finally {
          setIsFinalizing(false);
        }
      };
      finalizeAndRedirect();
    }
  }, [
    questionCount,
    maxQuestions,
    messages.length,
    isLoading,
    isFinalizing,
    sessionId,
    projectId,
    router,
  ]);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/clarifier/sessions/${sessionId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, [sessionId]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  // Auto-focus input
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || isQuestionLimitReached) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setShowTyping(true);

    try {
      const response = await fetch(`/api/clarifier/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage }),
      });

      if (response.ok) {
        // Reload messages to get the full conversation
        await loadMessages();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      setShowTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[700px] rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-[color:rgba(15,23,42,0.12)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:rgba(37,99,235,0.12)]">
              <MessageSquare className="h-5 w-5 text-[color:var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[color:var(--color-text)]">Feature clarification</h2>
              <p className="text-sm text-[color:rgba(15,23,42,0.6)]">
                Let&apos;s understand your requirements together
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">
              Questions: {questionCount}/{maxQuestions}
            </div>
            {isQuestionLimitReached && (
              <div className="mt-1 text-xs text-[color:rgba(15,23,42,0.6)]">Limit reached</div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[color:var(--color-background)]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-2 border-[color:rgba(15,23,42,0.16)] border-t-[color:var(--color-primary)] rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-[color:rgba(15,23,42,0.7)]">Starting conversation...</p>
            <p className="mt-2 text-xs text-[color:rgba(15,23,42,0.5)]">Preparing your first question</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-fade-in ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:rgba(37,99,235,0.12)]">
                    <Bot className="h-4 w-4 text-[color:var(--color-primary)]" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-[color:var(--color-primary)] text-white rounded-br-md'
                      : 'bg-[color:var(--color-surface)] text-[color:var(--color-text)] border border-[color:rgba(15,23,42,0.12)] rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">
                    {message.content}
                  </p>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user'
                        ? 'text-white/70'
                        : 'text-[color:rgba(15,23,42,0.5)]'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:rgba(15,23,42,0.12)]">
                    <User className="h-4 w-4 text-[color:rgba(15,23,42,0.7)]" />
                  </div>
                )}
              </div>
            ))}
            {showTyping && (
              <div className="flex gap-3 justify-start animate-fade-in">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:rgba(37,99,235,0.12)]">
                  <Bot className="h-4 w-4 text-[color:var(--color-primary)]" />
                </div>
                <div className="rounded-2xl rounded-bl-md border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] px-5 py-4 shadow-sm">
                  <div className="flex gap-1.5">
                    <div
                      className="w-2 h-2 bg-[color:rgba(37,99,235,0.6)] rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-[color:rgba(37,99,235,0.6)] rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-[color:rgba(37,99,235,0.6)] rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-5">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isQuestionLimitReached) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                isQuestionLimitReached
                  ? 'Question limit reached. Please finalize to proceed.'
                  : 'Type your answer here...'
              }
              className="w-full rounded-xl border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-background)] px-4 py-3 pr-12 text-sm text-[color:var(--color-text)] transition focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(37,99,235,0.2)] placeholder:text-[color:rgba(15,23,42,0.5)] disabled:cursor-not-allowed"
              rows={2}
              disabled={isLoading || isFinalizing || isQuestionLimitReached}
            />
            <div className="absolute right-3 bottom-3 text-xs text-[color:rgba(15,23,42,0.5)]">
              {input.length > 0 && (
                <span className="text-[color:rgba(15,23,42,0.5)]">
                  Enter to send • Shift+Enter for new line
                </span>
              )}
            </div>
          </div>
          <button
            onClick={sendMessage}
            disabled={isLoading || isFinalizing || !input.trim() || isQuestionLimitReached}
            className="inline-flex h-11 min-w-[96px] items-center justify-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[color:rgba(15,23,42,0.6)]">
            {isQuestionLimitReached ? (
              <>
                <span className="h-2 w-2 rounded-full bg-[color:rgba(15,23,42,0.4)]"></span>
                <span>
                  Question limit reached ({questionCount}/{maxQuestions})
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-[color:var(--color-primary)]"></span>
                <span>AI is ready to help</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
