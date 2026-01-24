
import React from 'react';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import useChat from './hooks/useChat';
import { WorkflowPhase } from './types';
import FileUpload from './components/FileUpload';

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
    showFileUpload,
    handleFileUpload,
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
    handleDesignProviderChange,
    designProvider,
    sessionClosed,
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
          <div className="flex items-center space-x-2">
              <label htmlFor="design-provider" className="text-xs sm:text-sm text-[#222222] font-medium whitespace-nowrap">
                Design model
              </label>
              <select
                id="design-provider"
                value={designProvider}
                onChange={(e) => handleDesignProviderChange(e.target.value as 'anthropic' | 'openai' | 'gemini')}
                className="text-xs sm:text-sm border border-[#E5E5E5] rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB]"
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
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

        {showFileUpload && (currentPhase === WorkflowPhase.NEW_WEBSITE_BRAND_DETAILS || currentPhase === WorkflowPhase.REDESIGN_BRAND_DETAILS) && (
          <div className="p-3 sm:p-4 border-t border-[#E5E5E5] shrink-0 bg-white">
            <FileUpload onFilesSelected={handleFileUpload} />
          </div>
        )}

        {currentPhase !== WorkflowPhase.NEW_WEBSITE_COMPLETE && currentPhase !== WorkflowPhase.REDESIGN_COMPLETE && !showFileUpload && !isCapturingScreenshot && showInput && !sessionClosed && (
          <InputBar 
            onSendMessage={sendMessage} 
            isLoading={isLoading} 
            placeholder={placeholder}
          />
        )}
      </div>
       <footer className="text-center mt-4 text-xs text-gray-600 px-4 sm:px-0">
          By continuing this chat, you consent to us saving your information and contacting you.
      </footer>
    </div>
  );
};

export default App;
