import type { Message } from '../../../types/inquiry';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function formatMessageTime(message: Message): string {
  const timestamp = message.timestamp as unknown as { toDate?: () => Date };
  if (timestamp && typeof timestamp.toDate === 'function') {
    return format(timestamp.toDate(), 'HH:mm');
  }
  return '';
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const timeStr = formatMessageTime(message);
  const displaySenderName =
    message.sender === 'admin'
      ? 'Admin'
      : (message.senderName || 'Customer');

  return (
    <div className={`flex ${isOwn ? 'justify-end mb-4' : 'justify-start mb-4'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${isOwn
        ? 'bg-emerald-500 text-white rounded-br-sm'
        : 'bg-stone-200 text-stone-900 rounded-bl-sm'
      }`}>
        {!isOwn && (
          <p className="text-xs font-semibold mb-1">
            {displaySenderName}
          </p>
        )}
        <p className="text-sm leading-relaxed">{message.content}</p>
        {timeStr && (
          <p className={`text-xs mt-1 ${isOwn ? 'text-emerald-100' : 'text-stone-500'}`}>
            {timeStr}
          </p>
        )}
      </div>
    </div>
  );
}

