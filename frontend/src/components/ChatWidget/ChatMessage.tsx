import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '../../types/chat';

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-row ${isUser ? 'user' : ''}`}>
      <div className={`message-avatar ${isUser ? 'user' : 'ai'}`}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={`message-bubble ${isUser ? 'user' : 'ai'} ${message.isError ? 'error' : ''}`}>
        {isUser ? (
          <span>{message.content}</span>
        ) : message.content === '' && message.isStreaming ? (
          <div className="typing-dots">
            <span /><span /><span />
          </div>
        ) : (
          <>
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {message.isStreaming && <span className="streaming-cursor" />}
          </>
        )}
      </div>
    </div>
  );
}
