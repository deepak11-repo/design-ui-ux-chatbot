
import React, { useRef, useEffect } from 'react';
import { Message, MessageSender } from '../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import GenerationLoader from './GenerationLoader';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  showQuickActions?: boolean;
  quickActionOptions?: string[];
  onQuickAction?: (text: string) => void;
  selectedOptions?: string[];
  isGeneratingHtml?: boolean;
  generationProgressText?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  isLoading, 
  showQuickActions = false,
  quickActionOptions = [],
  onQuickAction,
  selectedOptions = [],
  isGeneratingHtml = false,
  generationProgressText = 'Generating your webpage...'
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (containerRef.current && messagesEndRef.current) {
      // Scroll only the container, not the entire page
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, showQuickActions]);

  // Find the last bot message index
  const lastBotMessageIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === MessageSender.BOT) {
        return i;
      }
    }
    return -1;
  })();

  return (
    <div ref={containerRef} className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 overflow-y-auto bg-gradient-to-b from-transparent to-[#FAFAFA] custom-scrollbar">
      {messages.map((msg, index) => {
        const isLastBotMessage = index === lastBotMessageIndex && msg.sender === MessageSender.BOT;
        return (
          <MessageBubble 
            key={msg.id} 
            message={msg}
            showQuickActions={isLastBotMessage && showQuickActions}
            quickActionOptions={isLastBotMessage ? quickActionOptions : []}
            onQuickAction={onQuickAction}
            isLastBotMessage={isLastBotMessage}
            selectedOptions={isLastBotMessage ? selectedOptions : []}
          />
        );
      })}
      {isGeneratingHtml && <GenerationLoader progressText={generationProgressText} />}
      {isLoading && !isGeneratingHtml && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;