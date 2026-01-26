
import React from 'react';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import useChat from './hooks/useChat';
import { WorkflowPhase } from './types';

const App: React.FC = () => {
  const {
    messages,
    sendMessage,
    isLoading,
    currentPhase,
    handleQuickAction,
    getCurrentQuestionOptions,
    shouldShowQuickActions,
    getCurrentQuestionPlaceholder,
    shouldShowInputBar,
    getSelectedOptions,
    isGeneratingHtml,
    generationProgressText,
    isCapturingScreenshot,
    screenshotProgressText,
    handleAuditContinue,
    handleRatingSubmit,
    handleFeedbackSubmit,
    handleEmailSubmit,
    handleReferencesAndCompetitorsSubmit,
    sessionClosed,
    sessionLimitReached,
    startNewChat,
  } = useChat();

  const questionOptions = getCurrentQuestionOptions();
  const showQuickActions = shouldShowQuickActions();
  const placeholder = getCurrentQuestionPlaceholder();
  const showInput = shouldShowInputBar();

  return (
    <div className="h-screen w-full flex flex-col items-center p-2 sm:p-4">
      <div className="w-full max-w-2xl flex-grow flex flex-col bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <header className="px-3 py-2.5 sm:px-4 sm:py-3 md:p-4 flex items-center justify-between shrink-0 bg-[rgb(225,233,251)] rounded-t-2xl">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <img 
              src={`${import.meta.env.BASE_URL}assets/chatbot.png`} 
              alt="Chatbot Icon" 
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain flex-shrink-0" 
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-[#222222] truncate">
                Design UI/UX Chatbot
              </h1>
              <p className="text-xs sm:text-sm text-[#222222] truncate">
                Your design assistant for websites
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ca03d] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2ca03d]"></span>
            </span>
            <span className="text-sm font-medium text-[#222222]">
              Online
            </span>
          </div>
        </header>
        
        <ChatWindow 
          messages={messages} 
          isLoading={isLoading} 
          showQuickActions={
            (messages.length <= 2 && currentPhase === WorkflowPhase.INITIAL) ||
            (showQuickActions && questionOptions.length > 0 && currentPhase !== WorkflowPhase.INITIAL && currentPhase !== WorkflowPhase.NEW_WEBSITE_COMPLETE && currentPhase !== WorkflowPhase.REDESIGN_COMPLETE)
          }
          quickActionOptions={
            currentPhase === WorkflowPhase.INITIAL 
              ? ["Webpage Redesign", "New Webpage from Scratch"]
              : questionOptions
          }
          onQuickAction={handleQuickAction}
          selectedOptions={getSelectedOptions()}
          isGeneratingHtml={isGeneratingHtml}
          generationProgressText={generationProgressText}
          isCapturingScreenshot={isCapturingScreenshot}
          screenshotProgressText={screenshotProgressText}
          onAuditContinue={handleAuditContinue}
          onRatingSubmit={handleRatingSubmit}
          onFeedbackSubmit={handleFeedbackSubmit}
          onEmailSubmit={handleEmailSubmit}
          onReferencesAndCompetitorsSubmit={handleReferencesAndCompetitorsSubmit}
        />

        {/* Show InputBar when session is active */}
        {currentPhase !== WorkflowPhase.NEW_WEBSITE_COMPLETE && currentPhase !== WorkflowPhase.REDESIGN_COMPLETE && !isCapturingScreenshot && showInput && !sessionClosed && (
          <InputBar 
            onSendMessage={sendMessage} 
            isLoading={isLoading} 
            placeholder={placeholder}
          />
        )}

        {/* Show "Start a New Chat" button when session is closed and limit not reached */}
        {sessionClosed && !sessionLimitReached && (
          <div className="p-3 sm:p-4 border-t border-[#E5E5E5] shrink-0 bg-white">
            <button
              onClick={startNewChat}
              className="w-full text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-[#2563EB] text-white border border-[#1D4ED8] hover:bg-[#1D4ED8] hover:border-[#1E40AF] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb]/60 transition-all duration-200 font-medium"
            >
              Start a New Chat
            </button>
          </div>
        )}

        {/* Show session limit message when limit is reached */}
        {sessionLimitReached && (
          <div className="p-3 sm:p-4 border-t border-[#E5E5E5] shrink-0 bg-white">
            <div className="w-full px-4 sm:px-6 py-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-sm sm:text-base text-gray-700 text-center">
                You've reached the maximum number of sessions (2). Thank you for using our chatbot!
              </p>
            </div>
          </div>
        )}
      </div>
       <footer className="text-center mt-4 text-xs text-gray-600 px-4 sm:px-0">
          By continuing this chat, you consent to us saving your information and contacting you.
      </footer>
    </div>
  );
};

export default App;
