'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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

  // Count questions asked by AI (assistant messages)
  const questionCount = messages.filter((msg) => msg.role === 'assistant').length;
  const maxQuestions = 10;
  const isQuestionLimitReached = questionCount >= maxQuestions;

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

  const handleFinalize = async () => {
    if (
      !confirm('Are you ready to finalize the clarifications and proceed with sprint planning?')
    ) {
      return;
    }

    setIsFinalizing(true);

    try {
      const response = await fetch(`/api/clarifier/sessions/${sessionId}/finalize`, {
        method: 'POST',
      });

      if (response.ok) {
        const { clarifications } = await response.json();

        // Create a run with the clarifications
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
          router.push(`/projects/${projectId}?runId=${runData.run.id}`);
        } else {
          const error = await runResponse.json();
          alert(error.error || 'Failed to create run');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to finalize clarifications');
      }
    } catch (error) {
      console.error('Failed to finalize:', error);
      alert('Failed to finalize. Please try again.');
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[700px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-xl">💬</span>
            </div>
            <div>
              <h2 className="font-bold text-lg">Feature Clarification</h2>
              <p className="text-sm text-white/90">
                Let&apos;s understand your requirements together
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">
              Questions: {questionCount}/{maxQuestions}
            </div>
            {isQuestionLimitReached && (
              <div className="text-xs text-white/80 mt-1">Limit reached</div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
            </div>
            <p className="text-gray-500 text-lg font-medium">Starting conversation...</p>
            <p className="text-gray-400 text-sm mt-2">Preparing your first question</p>
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
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">🤖</span>
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-5 py-4 shadow-md ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                    {message.content}
                  </p>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg font-bold">You</span>
                  </div>
                )}
              </div>
            ))}
            {showTyping && (
              <div className="flex gap-3 justify-start animate-in fade-in">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">🤖</span>
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-5 py-4 shadow-sm border border-gray-100">
                  <div className="flex gap-1.5">
                    <div
                      className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
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
      <div className="border-t border-gray-200 bg-white p-5">
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
              className="w-full px-5 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={2}
              disabled={isLoading || isFinalizing || isQuestionLimitReached}
            />
            <div className="absolute right-3 bottom-3 text-xs text-gray-400">
              {input.length > 0 && (
                <span className="text-gray-400">Enter to send • Shift+Enter for new line</span>
              )}
            </div>
          </div>
          <button
            onClick={sendMessage}
            disabled={isLoading || isFinalizing || !input.trim() || isQuestionLimitReached}
            className="px-6 h-[56px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:transform-none flex items-center justify-center min-w-[100px]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Send</span>
                <span className="ml-2">→</span>
              </>
            )}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            {isQuestionLimitReached ? (
              <>
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>
                  Question limit reached ({questionCount}/{maxQuestions})
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>AI is ready to help</span>
              </>
            )}
          </div>
          <button
            onClick={handleFinalize}
            disabled={isLoading || isFinalizing || messages.length < 2}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:transform-none flex items-center gap-2"
          >
            {isFinalizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Finalizing...</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>Finalize & Generate Sprint Plan</span>
                <span>🚀</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
