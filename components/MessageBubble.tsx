import React from 'react';
import { Message, MessageSender } from '../types';
import UserAvatar from './UserAvatar';
import BotAvatar from './BotAvatar';
import HtmlPreview from './HtmlPreview';
import AuditResults from './AuditResults';
import RatingPrompt from './RatingPrompt';
import FeedbackPrompt from './FeedbackPrompt';
import EmailPrompt from './EmailPrompt';
import ReferencesAndCompetitorsPrompt from './ReferencesAndCompetitorsPrompt';

interface MessageBubbleProps {
  message: Message;
  showQuickActions?: boolean;
  quickActionOptions?: string[];
  onQuickAction?: (text: string) => void;
  isLastBotMessage?: boolean;
  selectedOptions?: string[];
  onAuditContinue?: () => void;
  onRatingSubmit?: (score: number) => void;
  onFeedbackSubmit?: (feedback: string) => void;
  onEmailSubmit?: (email: string) => void;
  onReferencesAndCompetitorsSubmit?: (entries: Array<{ url: string; description: string }>) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  showQuickActions = false, 
  quickActionOptions = [],
  onQuickAction,
  isLastBotMessage = false,
  selectedOptions = [],
  onAuditContinue,
  onRatingSubmit,
  onFeedbackSubmit,
  onEmailSubmit,
  onReferencesAndCompetitorsSubmit
}) => {
  const isUser = message.sender === MessageSender.USER;

  const baseBubbleClasses = 'max-w-[85%] sm:max-w-[75%] md:max-w-md lg:max-w-lg px-4 py-2.5 sm:py-3 shadow-sm rounded-xl break-words';
  const userBubbleClasses = 'bg-[#EDF5FF] text-[#2C2C2C] self-end rounded-br-none';
  const botBubbleClasses = 'bg-[#FFFBEB] text-[#2C2C2C] self-start rounded-bl-none border border-[#FFE5A0]';

  const formattedText = message.text.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ));

  return (
    <div className={`flex items-end gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? <UserAvatar /> : <BotAvatar />}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}>
        <div className={`${baseBubbleClasses} ${isUser ? userBubbleClasses : botBubbleClasses}`}>
          <p className="text-xs sm:text-sm leading-5 sm:leading-6">{formattedText}</p>
        </div>
        {!isUser && message.isHtmlMessage && message.htmlContent && (
          <div className="mt-3 w-full max-w-4xl">
            <HtmlPreview html={message.htmlContent} />
          </div>
        )}
        {!isUser && message.isAuditMessage && message.auditIssues && (
          <AuditResults 
            issues={message.auditIssues} 
            onContinue={onAuditContinue}
          />
        )}
        {!isUser && message.isRatingPrompt && onRatingSubmit && (
          <RatingPrompt onSubmit={onRatingSubmit} />
        )}
        {!isUser && message.isFeedbackPrompt && onFeedbackSubmit && (
          <FeedbackPrompt onSubmit={onFeedbackSubmit} />
        )}
        {!isUser && message.isEmailPrompt && onEmailSubmit && (
          <EmailPrompt onSubmit={onEmailSubmit} />
        )}
        {!isUser && message.isReferencesAndCompetitorsPrompt && onReferencesAndCompetitorsSubmit && (
          <ReferencesAndCompetitorsPrompt onSubmit={onReferencesAndCompetitorsSubmit} />
        )}
        {!isUser && isLastBotMessage && showQuickActions && quickActionOptions.length > 0 && (
          <div className="mt-2.5 sm:mt-3 w-full animate-fadeIn">
            {/* Separate regular options from Done button */}
            {(() => {
              const regularOptions = quickActionOptions.filter(opt => !opt.startsWith('Done selecting'));
              const doneOptions = quickActionOptions.filter(opt => opt.startsWith('Done selecting'));
              
              return (
                <>
                  {/* Regular options as chips/tags */}
                  <div className="flex flex-wrap gap-2 sm:gap-2.5 mb-2.5 sm:mb-3">
                    {regularOptions.map((option) => {
                      const isSelected = selectedOptions.includes(option);
                      const baseChipClasses =
                        'text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer whitespace-nowrap font-medium';
                      const unselectedClasses =
                        'bg-white text-[#2C2C2C] border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 focus:ring-[#2563eb]/40';
                      const selectedClasses =
                        'bg-[#2563EB] text-white border-[#1D4ED8] hover:bg-[#1D4ED8] hover:border-[#1E40AF] active:bg-[#1E40AF] focus:ring-[#2563eb]/60';

                      return (
                        <button
                          key={option}
                          onClick={() => onQuickAction?.(option)}
                          className={`${baseChipClasses} ${isSelected ? selectedClasses : unselectedClasses}`}
                          aria-label={isSelected ? `Deselect ${option}` : `Select ${option}`}
                          aria-pressed={isSelected}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Done button at bottom */}
                  {doneOptions.length > 0 && (
                    <div className="flex justify-start">
                      {doneOptions.map((option) => {
                        const doneClasses =
                          'text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-[#2563EB] text-white border border-[#1D4ED8] hover:bg-[#1D4ED8] hover:border-[#1E40AF] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm active:bg-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#2563eb]/60 cursor-pointer whitespace-nowrap font-medium transition-all duration-200';

                        return (
                          <button
                            key={option}
                            onClick={() => onQuickAction?.(option)}
                            className={doneClasses}
                            aria-label="Done selecting options"
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;