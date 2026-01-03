import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
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
  const [showSidebar, setShowSidebar] = useState(false);
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
      setShowSidebar(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    setLoading(true);
    setError(null);

    // Optimistically add user message
    const tempUserMessage: Message = {
      messageId: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await sendMessage(message, currentConversationId);
      
      // Remove temp message and add both user and assistant messages
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.messageId !== tempUserMessage.messageId);
        return [
          ...withoutTemp,
          {
            messageId: `user-${response.timestamp}`,
            role: 'user',
            content: message,
            timestamp: response.timestamp - 1000, // Slightly before AI response
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
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.messageId !== tempUserMessage.messageId));
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(undefined);
    setShowSidebar(false);
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
      {/* Header */}
      <div className="chat-header">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="sidebar-toggle"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="chat-title">AI Chat Assistant</h1>
        <button
          onClick={handleNewConversation}
          className="new-chat-button"
          aria-label="New conversation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="ml-2">New Chat</span>
        </button>
      </div>

      <div className="chat-layout">
        {/* Sidebar */}
        <div className={`chat-sidebar ${showSidebar ? 'show' : ''}`}>
          <div className="sidebar-content">
            <h2 className="sidebar-title">Conversations</h2>
            {conversations.length === 0 ? (
              <p className="sidebar-empty">No conversations yet</p>
            ) : (
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
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {/* Messages */}
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Start a conversation
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Ask me anything! I'm here to help.
                </p>
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
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
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
          <ChatInput onSend={handleSendMessage} disabled={loading} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
