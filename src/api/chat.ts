const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://api.stinessolutions.com';

interface ChatMessage {
  conversationId: string;
  message: string;
  timestamp: number;
}

interface Conversation {
  conversationId: string;
  lastMessage: string;
  lastTimestamp: number;
  preview: string;
}

interface ConversationDetail {
  conversationId: string;
  messages: Array<{
    messageId: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

export async function sendMessage(
  message: string,
  conversationId?: string,
  maxTokens?: number
): Promise<ChatMessage> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify({
      message,
      conversationId,
      maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }

  return response.json();
}

export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch conversations');
  }

  const data = await response.json();
  return data.conversations || [];
}

export async function getConversation(conversationId: string): Promise<ConversationDetail> {
  const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch conversation');
  }

  return response.json();
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete conversation');
  }
}
