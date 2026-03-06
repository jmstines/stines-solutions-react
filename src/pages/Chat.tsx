import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../components/ChatMessage';
import { sendMessage, getConversations, getConversation, deleteConversation } from '../api/chat';
import './Chat.css';

interface Message {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Conversation {
  conversationId: string;
  lastMessage: string;
  lastTimestamp: number;
  preview: string;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [maxTokens, setMaxTokens] = useState<number>(500);
  const [inputMessage, setInputMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const convos = await getConversations();
      setConversations(convos);
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setLoading(true);
      const conversation = await getConversation(conversationId);
      setMessages(conversation.messages);
      setCurrentConversationId(conversationId);
      setError(null);
      // Close sidebar on mobile after selecting
      if (window.innerWidth <= 768) {
        setShowSidebar(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const message = inputMessage.trim();
    if (!message) return;

    setLoading(true);
    setError(null);
    setInputMessage('');

    const tempUserMessage: Message = {
      messageId: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await sendMessage(message, currentConversationId, maxTokens);

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.messageId !== tempUserMessage.messageId);
        return [
          ...withoutTemp,
          {
            messageId: `user-${response.timestamp}`,
            role: 'user',
            content: message,
            timestamp: response.timestamp - 1000,
          },
          {
            messageId: `assistant-${response.timestamp}`,
            role: 'assistant',
            content: response.message,
            timestamp: response.timestamp,
          },
        ];
      });

      setCurrentConversationId(response.conversationId);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.messageId !== tempUserMessage.messageId));
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await deleteConversation(conversationId);
      await loadConversations();

      if (currentConversationId === conversationId) {
        handleNewConversation();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className={`chat-sidebar ${showSidebar ? '' : 'hidden'}`}>
        <div className="sidebar-header">
          <button onClick={handleNewConversation} className="new-chat-btn" aria-label="New chat">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New chat</span>
          </button>
          <button
            onClick={() => setShowSidebar(false)}
            className="sidebar-toggle-btn"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="sidebar-conversations">
          {conversations.length === 0 ? (
            <p className="sidebar-empty">No conversations yet</p>
          ) : (
            <>
              <p className="sidebar-section-label">Recent</p>
              <div className="conversation-list">
                {conversations.map((conv) => (
                  <div
                    key={conv.conversationId}
                    className={`conversation-item ${
                      currentConversationId === conv.conversationId ? 'active' : ''
                    }`}
                  >
                    <button
                      onClick={() => loadConversation(conv.conversationId)}
                      className="conversation-button"
                    >
                      <p className="conversation-preview">{conv.preview}</p>
                      <p className="conversation-time">
                        {new Date(conv.lastTimestamp).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.conversationId);
                      }}
                      className="delete-button"
                      aria-label="Delete conversation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile overlay when sidebar open */}
      {showSidebar && (
        <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />
      )}

      {/* Main Area */}
      <div className="chat-main">
        {/* Persistent header with sidebar toggle */}
        <div className="chat-main-header">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="sidebar-toggle"
            aria-label={showSidebar ? 'Close sidebar' : 'Open sidebar'}
          >
            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h2 className="empty-state-title">How can I help you today?</h2>
              <p className="empty-state-subtitle">Ask me anything — I'm here to help.</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.messageId}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
              ))}
              {loading && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-center gap-3">
                    <div style={{ width: '28px', height: '28px', flexShrink: 0 }} className="rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg style={{ width: '14px', height: '14px' }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.683a1 1 0 01.633.633l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684z" />
                      </svg>
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto flex-shrink-0">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <div className="chat-input-box">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI Assistant..."
                disabled={loading}
                className="chat-textarea"
                rows={1}
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
                className="send-button"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
            <div className="input-footer">
              <p className="input-hint">Enter to send · Shift+Enter for new line</p>
              <div className="settings-inline">
                <label htmlFor="maxTokens" className="settings-label-sm">Length:</label>
                <select
                  id="maxTokens"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="settings-select"
                >
                  <option value={100}>Short</option>
                  <option value={200}>Medium</option>
                  <option value={300}>Long</option>
                  <option value={500}>Very long</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
