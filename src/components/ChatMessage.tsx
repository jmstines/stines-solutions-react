import React from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, timestamp }) => {
  const isUser = role === 'user';
  const date = new Date(timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[75%]">
          <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-br-sm px-4 py-3">
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{content}</p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right pr-1">{timeString}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 gap-3">
      <div style={{ width: '28px', height: '28px', flexShrink: 0, marginTop: '2px' }} className="rounded-full bg-emerald-500 flex items-center justify-center">
        <svg style={{ width: '14px', height: '14px' }} fill="currentColor" viewBox="0 0 20 20">
          <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.683a1 1 0 01.633.633l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">{content}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeString}</p>
      </div>
    </div>
  );
};
