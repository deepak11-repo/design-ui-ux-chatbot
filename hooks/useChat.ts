
import { useState, useEffect, useRef } from 'react';
import { Message, MessageSender, WorkflowPhase, UserResponses } from '../types';
import { 
  WELCOME_MESSAGE_1, 
  WELCOME_MESSAGE_2,
  NEW_WEBSITE_QUESTIONS,
  NEW_WEBSITE_QUESTION_ORDER,
  REDESIGN_WEBSITE_QUESTIONS,
  REDESIGN_WEBSITE_QUESTION_ORDER
} from '../constants';
import { 
  getPhaseFromString, 
  isNewWebsitePhase, 
  getNextQuestionIndex,
  isRedesignPhase,
  getNextRedesignQuestionIndex,
  isOtherOption,
  isYesResponse,
  isSkipAction
} from '../utils/questionHelpers';
import { getNextQuestionInfo, isReferencesAndCompetitorsPhase } from '../utils/questionNavigation';
import { hasUrls, normalizeUrl } from '../utils/validation';
import { loadChatState, saveChatState } from '../utils/storage';
import { VALIDATION_MESSAGES, OTHER_INPUT_MESSAGES, COMPLETION_MESSAGE } from '../constants/messages';
import { 
  isIDontHaveAny, 
  validateNonEmpty, 
  parseMultiSelect, 
  joinMultiSelect, 
  toggleMultiSelectOption,
  normalizeMultiSelectForDisplay
} from '../utils/responseHelpers';
import { buildCommonPrompt } from '../services/prompts/commonPrompt';
import { getPageTypePrompt, buildFullPrompt } from '../services/prompts/pageTypePrompts';
import { buildRedesignPrompt } from '../services/prompts/redesignPrompt';
import { analyzeScreenshotWithGemini, generateHtmlWithGemini } from '../services/ai/geminiService';
import { generateHtmlWithAnthropic } from '../services/ai/anthropicService';
import { generateHtmlWithOpenAI } from '../services/ai/openaiService';
import { extractHtmlFromResponse } from '../services/ai/htmlProcessor';
import { captureWebpageScreenshot } from '../services/api/apiflashService';
import { arrayBufferToBinaryString, arrayBufferToBase64 } from '../utils/binaryUtils';
import { UI_UX_AUDIT_PROMPT } from '../services/prompts/uiUxAuditPrompt';
import { parseAuditResponse } from '../utils/auditParser';
import { buildUserFriendlyErrorMessage, getAndValidateApiKey, getAndValidateAnthropicApiKey, getAndValidateOpenAIApiKey, buildMissingApiKeyMessage } from '../utils/errorMessages';
import { logger } from '../utils/logger';
// Note: getAndValidateApiKey is used for Gemini (analysis), getAndValidateAnthropicApiKey/getAndValidateOpenAIApiKey are used for design generation depending on selection

const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE_1, WELCOME_MESSAGE_2]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>(WorkflowPhase.INITIAL);
  const [userResponses, setUserResponses] = useState<UserResponses>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<'newWebsite' | 'redesign' | null>(null);
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);
  const [generationProgressText, setGenerationProgressText] = useState('Generating your webpage...');
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotProgressText, setScreenshotProgressText] = useState('Analyzing your page');
  const [sessionClosed, setSessionClosed] = useState(false);
  const [ratingRequested, setRatingRequested] = useState(false);
  const [ratingCompleted, setRatingCompleted] = useState(false);
  const [ratingScore, setRatingScore] = useState<number | null>(null);
  const [designProvider, setDesignProvider] = useState<'anthropic' | 'openai' | 'gemini'>('anthropic');
  
  // Helper function to reset generation state
  const resetGenerationState = () => {
    setIsGeneratingHtml(false);
    setIsLoading(false);
    setGenerationProgressText('Generating your webpage...');
  };
  
  // Helper function to reset screenshot state
  const resetScreenshotState = () => {
    setIsCapturingScreenshot(false);
    setScreenshotProgressText('Analyzing your page');
  };

  const enqueueRatingPrompt = () => {
    if (sessionClosed || ratingRequested) return;
    setRatingRequested(true);
    addMessage(
      'Please rate this design from 1 to 5 (1 = needs work, 5 = love it).',
      MessageSender.BOT,
      { isRatingPrompt: true }
    );
  };

  const handleRatingSubmit = (score: number) => {
    if (ratingCompleted || sessionClosed) return;
    setRatingCompleted(true);
    setRatingScore(score);

    // Log user rating as a message
    addMessage(`I rate this design ${score}/5`, MessageSender.USER);

    if (score < 4) {
      addMessage(
        "Thanks for the honesty! What didn't you like about the design?",
        MessageSender.BOT,
        { isFeedbackPrompt: true }
      );
    } else {
      addMessage(
        'Great! Please share your email so we can connect you with an engineer.',
        MessageSender.BOT,
        { isEmailPrompt: true }
      );
    }
  };

  const handleFeedbackSubmit = (feedback: string) => {
    if (sessionClosed) return;
    addMessage(feedback, MessageSender.USER);
    addMessage(
      'Thanks for sharing. Please drop your email so an engineer can connect with you.',
      MessageSender.BOT,
      { isEmailPrompt: true }
    );
  };

  const handleEmailSubmit = (email: string) => {
    if (sessionClosed) return;
    addMessage(email, MessageSender.USER);
    addMessage(
      'Thanks! An engineer will connect with you shortly. Closing the session now.',
      MessageSender.BOT
    );
    setSessionClosed(true);
  };

  const handleReferencesAndCompetitorsSubmit = (entries: Array<{ url: string; description: string }>) => {
    if (sessionClosed) return;
    
    // Store as formatted string (empty if "I don't have any" was selected)
    const updatedResponses = { ...userResponses };
    const currentQuestion = getCurrentQuestion();
    
    let displayMessage: string;
    let storedValue: string;
    
    if (entries.length === 0) {
      // User selected "I don't have any"
      displayMessage = "I don't have any";
      storedValue = '';
    } else {
      // Format entries as a readable string
      displayMessage = entries.map((entry, index) => 
        `${index + 1}. ${entry.url} - ${entry.description}`
      ).join('\n');
      storedValue = displayMessage;
    }
    
    if (currentQuestion && isReferencesAndCompetitorsPhase(currentQuestion.phase)) {
      if (currentQuestion.phase === 'NewWebsiteReferencesAndCompetitors') {
        updatedResponses.referencesAndCompetitors = storedValue;
      } else if (currentQuestion.phase === 'RedesignReferencesAndCompetitors') {
        updatedResponses.redesignReferencesAndCompetitors = storedValue;
      }
    }
    
    setUserResponses(updatedResponses);
    
    // Display user's response as a message
    addMessage(displayMessage, MessageSender.USER);
    
    // Move to next question
    moveToNextQuestion(updatedResponses);
  };

  const handleDesignProviderChange = (provider: 'anthropic' | 'openai' | 'gemini') => {
    setDesignProvider(provider);
  };

  useEffect(() => {
    const savedState = loadChatState();
    if (savedState) {
      setMessages(savedState.messages);
      if (savedState.currentPhase) setCurrentPhase(savedState.currentPhase);
      setUserResponses(savedState.userResponses);
      setCurrentQuestionIndex(savedState.currentQuestionIndex);
      // Derive current flow from saved phase
      if (isNewWebsitePhase(savedState.currentPhase)) {
        setCurrentFlow('newWebsite');
      } else if (isRedesignPhase(savedState.currentPhase)) {
        setCurrentFlow('redesign');
      } else {
        setCurrentFlow(null);
      }
    }
  }, []);

  useEffect(() => {
    saveChatState({
      messages,
      currentPhase,
      userResponses,
      currentQuestionIndex,
    });
  }, [messages, currentPhase, userResponses, currentQuestionIndex]);

  // Counter to ensure unique message IDs even when messages are created in the same millisecond
  const messageIdCounterRef = useRef(0);

  const addMessage = (text: string, sender: MessageSender, extra?: Partial<Message>) => {
    messageIdCounterRef.current += 1;
    const newMessage: Message = { 
      id: `${Date.now()}-${messageIdCounterRef.current}`, 
      text, 
      sender,
      ...extra,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const getCurrentQuestion = () => {
    if (!currentFlow) return null;

    const questionOrder = currentFlow === 'newWebsite' 
      ? NEW_WEBSITE_QUESTION_ORDER 
      : REDESIGN_WEBSITE_QUESTION_ORDER;
    const questions = currentFlow === 'newWebsite'
      ? NEW_WEBSITE_QUESTIONS
      : REDESIGN_WEBSITE_QUESTIONS;

    if (currentQuestionIndex < 0 || currentQuestionIndex >= questionOrder.length) {
      return null;
    }

    const questionKey = questionOrder[currentQuestionIndex];
    if (!questionKey) {
      logger.warn(`Invalid question index: ${currentQuestionIndex} for flow: ${currentFlow}`);
      return null;
    }

    const question = questions[questionKey];
    if (!question) {
      logger.warn(`Question not found for key: ${questionKey} in flow: ${currentFlow}`);
      return null;
    }

    return question;
  };

  const moveToNextQuestion = (updatedResponses?: UserResponses) => {
    if (currentFlow === 'newWebsite') {
      // Use updated responses if provided, otherwise use current state
      const responsesToCheck = updatedResponses || userResponses;
      const nextIndex = getNextQuestionIndex(
        currentQuestionIndex,
        NEW_WEBSITE_QUESTION_ORDER,
        responsesToCheck
      );

      const nextQuestionInfo = getNextQuestionInfo(
        nextIndex,
        NEW_WEBSITE_QUESTION_ORDER,
        NEW_WEBSITE_QUESTIONS,
        'newWebsite'
      );

      if (!nextQuestionInfo) {
        // All questions completed
        setCurrentPhase(WorkflowPhase.NEW_WEBSITE_COMPLETE);
        // Trigger HTML generation
        generateHtml();
      } else {
        setCurrentQuestionIndex(nextQuestionInfo.index);
        setCurrentPhase(getPhaseFromString(nextQuestionInfo.question.phase));
        const isRefsAndCompetitors = isReferencesAndCompetitorsPhase(nextQuestionInfo.question.phase);
        addMessage(nextQuestionInfo.question.question, MessageSender.BOT, { isReferencesAndCompetitorsPrompt: isRefsAndCompetitors });
      }
      return;
    }

    if (currentFlow === 'redesign') {
      const nextIndex = getNextRedesignQuestionIndex(
        currentQuestionIndex,
        REDESIGN_WEBSITE_QUESTION_ORDER,
        updatedResponses || userResponses
      );

      if (nextIndex >= REDESIGN_WEBSITE_QUESTION_ORDER.length) {
        // All redesign questions completed
        setCurrentPhase(WorkflowPhase.REDESIGN_COMPLETE);
        
        // Trigger API call to capture webpage screenshot if URL is provided
        const responsesToCheck = updatedResponses || userResponses;
        if (responsesToCheck.redesignCurrentUrl && responsesToCheck.redesignCurrentUrl.trim()) {
          // Show loader instead of completion message
          setIsCapturingScreenshot(true);
          setScreenshotProgressText('Analyzing your page');
          captureWebpageScreenshotAndLog(responsesToCheck.redesignCurrentUrl);
      } else {
          // No URL provided for analysis; allow user to move forward to generate redesign
          const auditMessage: Message = {
            id: `audit-${Date.now()}`,
            text: 'No webpage URL was provided for analysis. You can still proceed to generate a redesigned webpage.',
            sender: MessageSender.BOT,
            auditIssues: ['No URL provided for analysis.'],
            isAuditMessage: true,
          };
          setMessages((prev) => [...prev, auditMessage]);
        }
      } else {
        const nextQuestionInfo = getNextQuestionInfo(
          nextIndex,
          REDESIGN_WEBSITE_QUESTION_ORDER,
          REDESIGN_WEBSITE_QUESTIONS,
          'redesign'
        );
        
        if (!nextQuestionInfo) {
          logger.error(`Redesign question navigation failed at index ${nextIndex}`);
          addMessage("I encountered an error. Please refresh the page and try again.", MessageSender.BOT);
          return;
        }
        
        setCurrentQuestionIndex(nextQuestionInfo.index);
        setCurrentPhase(getPhaseFromString(nextQuestionInfo.question.phase));
        const isRefsAndCompetitors = isReferencesAndCompetitorsPhase(nextQuestionInfo.question.phase);
        addMessage(nextQuestionInfo.question.question, MessageSender.BOT, { isReferencesAndCompetitorsPrompt: isRefsAndCompetitors });
      }
    }
  };

  const handleOtherInput = (response: string, field: 'pageType' | 'redesignIssues'): boolean => {
    // If user types "Other" again while waiting, give them a helpful message
    if (isOtherOption(response)) {
      const message = OTHER_INPUT_MESSAGES[field]?.again || "Please provide your input.";
      addMessage(message, MessageSender.BOT);
      return true; // Handled, wait for actual input
    }
    
    // Validate that user provided actual input
    if (!response || !response.trim()) {
      const message = OTHER_INPUT_MESSAGES[field]?.empty || "Please provide your input.";
      addMessage(message, MessageSender.BOT);
      return true; // Handled, wait for valid input
    }
    
    return false; // Not handled, proceed with processing
  };

  const handleOtherInputResponse = (response: string, field: 'pageType' | 'redesignIssues'): void => {
    const updatedResponses = { ...userResponses };
    const trimmedResponse = response.trim();
    
    if (field === 'pageType') {
      updatedResponses.pageType = `Other: ${trimmedResponse}`;
    } else if (field === 'redesignIssues') {
      // Add the "Other" input to the existing issues list (use pipe delimiter)
      const existing = parseMultiSelect(updatedResponses.redesignIssues);
      existing.push(`Other: ${trimmedResponse}`);
      updatedResponses.redesignIssues = joinMultiSelect(existing);
    }
    
    updatedResponses.waitingForOtherInput = undefined;
    setUserResponses(updatedResponses);
    moveToNextQuestion(updatedResponses);
  };

  const handleNewWebsiteResponse = (response: string, isQuickAction: boolean = false) => {
    // First, check if we're waiting for "Other" input from a previous question
    if (userResponses.waitingForOtherInput === 'pageType') {
      if (handleOtherInput(response, 'pageType')) {
        return; // Wait for valid input
      }
      handleOtherInputResponse(response, 'pageType');
      return;
    }

    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    // Store the response
    const updatedResponses = { ...userResponses };
    
    if (currentQuestion.phase === 'NewWebsiteBusiness') {
      const validationError = validateNonEmpty(response, VALIDATION_MESSAGES.business);
      if (validationError) {
        addMessage(validationError, MessageSender.BOT);
        return;
      }
      updatedResponses.business = response.trim();
    } else if (currentQuestion.phase === 'NewWebsiteAudience') {
      const validationError = validateNonEmpty(response, VALIDATION_MESSAGES.audience);
      if (validationError) {
        addMessage(validationError, MessageSender.BOT);
        return;
      }
      updatedResponses.audience = response.trim();
    } else if (currentQuestion.phase === 'NewWebsiteGoals') {
      const validationError = validateNonEmpty(response, VALIDATION_MESSAGES.goals);
      if (validationError) {
        addMessage(validationError, MessageSender.BOT);
        return;
      }
      updatedResponses.goals = response.trim();
    } else if (currentQuestion.phase === 'NewWebsitePageType') {
      // Check if user selected "Other" (either via button click or typing)
      if (isOtherOption(response)) {
        updatedResponses.waitingForOtherInput = 'pageType';
        setUserResponses(updatedResponses);
        addMessage(OTHER_INPUT_MESSAGES.pageType.prompt, MessageSender.BOT);
        return; // Wait for text input
      }
      updatedResponses.pageType = response;
      updatedResponses.waitingForOtherInput = undefined;
    } else if (currentQuestion.phase === 'NewWebsiteBrand') {
      // Check if user selected "I don't have any"
      if (isIDontHaveAny(response)) {
        updatedResponses.brandDetails = '';
        // Store empty string to indicate "I don't have any"
      } else {
        // Validate non-empty response
        const validationError = validateNonEmpty(response, VALIDATION_MESSAGES.brandDetails);
        if (validationError) {
          addMessage(validationError, MessageSender.BOT);
          return;
        }
        updatedResponses.brandDetails = response.trim();
      }
    }
    // ReferencesAndCompetitors is now handled by the custom component, not text input

    setUserResponses(updatedResponses);

    // Move to next question
    moveToNextQuestion(updatedResponses);
  };

  const handleRedesignResponse = (response: string) => {
    // First, check if we're waiting for "Other" input from a previous question
    if (userResponses.waitingForOtherInput === 'redesignIssues') {
      if (handleOtherInput(response, 'redesignIssues')) {
        return; // Still waiting for valid input
      }
      handleOtherInputResponse(response, 'redesignIssues');
      return;
    }

    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    const updatedResponses = { ...userResponses };

    if (currentQuestion.phase === 'RedesignCurrentUrl') {
      // If user enters nothing, treat as "no webpage / prefer not to share" and continue
      if (!response.trim()) {
        updatedResponses.redesignCurrentUrl = '';
      } else {
        // Normalize URL (prepend https:// if domain-only)
        const normalizedResponse = normalizeUrl(response.trim());
        
        // Validate URL if provided
        if (!hasUrls(normalizedResponse)) {
          addMessage("I didn't detect a valid webpage URL. Please paste the full URL (e.g., https://example.com or example.com), or leave it blank if you don't have one.", MessageSender.BOT);
          setUserResponses(updatedResponses);
          return;
        }
        updatedResponses.redesignCurrentUrl = normalizedResponse;
      }
      // Continue to move to next question
    } else if (currentQuestion.phase === 'RedesignReuseContent') {
      updatedResponses.redesignReuseContent = isYesResponse(response);
      setUserResponses(updatedResponses);
      // Move to next question with updated responses
      moveToNextQuestion(updatedResponses);
      return;
    } else if (currentQuestion.phase === 'RedesignAudience') {
      const validationError = validateNonEmpty(response, VALIDATION_MESSAGES.audience);
      if (validationError) {
        addMessage(validationError, MessageSender.BOT);
        setUserResponses(updatedResponses);
        return;
      }
      updatedResponses.redesignAudience = response.trim();
      // Continue to move to next question
    } else if (currentQuestion.phase === 'RedesignIssues') {
      const trimmed = response.trim();
      if (!trimmed) {
        addMessage("Please select at least one option that describes what is not working with your current webpage.", MessageSender.BOT);
        setUserResponses(updatedResponses);
        return;
      }

      const issuesQuestion = REDESIGN_WEBSITE_QUESTIONS['issues'];
      const issueOptions = issuesQuestion?.options || [];

      // Handle "Done" option to move forward after multi-select
      if (trimmed === 'Done selecting issues') {
        if (!updatedResponses.redesignIssues || !updatedResponses.redesignIssues.trim()) {
          addMessage("Please select at least one option that describes what is not working with your current webpage.", MessageSender.BOT);
          return;
        }
        setUserResponses(updatedResponses);
        moveToNextQuestion(updatedResponses);
        return;
      }

      // Check if user selected "Other"
      if (isOtherOption(trimmed)) {
        updatedResponses.waitingForOtherInput = 'redesignIssues';
        setUserResponses(updatedResponses);
        addMessage(OTHER_INPUT_MESSAGES.redesignIssues.prompt, MessageSender.BOT);
        return; // Wait for text input
      }

      // If the response matches one of the predefined options, treat it as part of a multi-select (toggle on/off)
      if (issueOptions.includes(trimmed)) {
        updatedResponses.redesignIssues = toggleMultiSelectOption(
          updatedResponses.redesignIssues,
          trimmed,
          issueOptions
        );
        setUserResponses(updatedResponses);
        return;
      }

      // Otherwise, treat as a free-text description and move on
      updatedResponses.redesignIssues = trimmed;
    }
    // RedesignReferencesAndCompetitors is now handled by the custom component, not text input

    setUserResponses(updatedResponses);
    moveToNextQuestion(updatedResponses);
  };

  const startNewWebsiteFlow = () => {
    addMessage("Excellent! Creating a new webpage from scratch is exciting. Let me ask you a few questions to understand your needs better.", MessageSender.BOT);
    setTimeout(() => {
      setCurrentQuestionIndex(0);
      setCurrentFlow('newWebsite');
      const firstQuestion = NEW_WEBSITE_QUESTIONS[NEW_WEBSITE_QUESTION_ORDER[0]];
      if (!firstQuestion) {
        logger.error('First question not found in new website flow');
        addMessage("I encountered an error starting the flow. Please refresh the page and try again.", MessageSender.BOT);
        return;
      }
      setCurrentPhase(getPhaseFromString(firstQuestion.phase));
      const isRefsAndCompetitors = isReferencesAndCompetitorsPhase(firstQuestion.phase);
      addMessage(firstQuestion.question, MessageSender.BOT, { isReferencesAndCompetitorsPrompt: isRefsAndCompetitors });
    }, 500);
  };

  const startRedesignFlow = () => {
    addMessage("Great! I'd be happy to help you with your webpage redesign. Let me ask you a few questions to understand your current webpage and what you're aiming for.", MessageSender.BOT);
    setTimeout(() => {
      setCurrentQuestionIndex(0);
      setCurrentFlow('redesign');
      const firstQuestion = REDESIGN_WEBSITE_QUESTIONS[REDESIGN_WEBSITE_QUESTION_ORDER[0]];
      if (!firstQuestion) {
        logger.error('First question not found in redesign flow');
        addMessage("I encountered an error starting the flow. Please refresh the page and try again.", MessageSender.BOT);
        return;
      }
      setCurrentPhase(getPhaseFromString(firstQuestion.phase));
      const isRefsAndCompetitors = isReferencesAndCompetitorsPhase(firstQuestion.phase);
      addMessage(firstQuestion.question, MessageSender.BOT, { isReferencesAndCompetitorsPrompt: isRefsAndCompetitors });
    }, 500);
  };

  const handleInitialChoice = (text: string): boolean => {
    const normalizedText = text.toLowerCase().trim();
    
    if (normalizedText.includes('webpage redesign') || normalizedText.includes('website redesign') || normalizedText.includes('redesign') || text === "Webpage Redesign" || text === "Website Redesign") {
      startRedesignFlow();
      return true;
    } else if (normalizedText.includes('new webpage') || normalizedText.includes('new website') || normalizedText.includes('from scratch') || normalizedText.includes('scratch') || text === "New Webpage from Scratch" || text === "New Website from Scratch") {
      startNewWebsiteFlow();
      return true;
    }
    
    return false;
  };

  const sendMessage = (text: string) => {
    if (sessionClosed || isLoading || !text.trim()) return;
    
    addMessage(text, MessageSender.USER);
    
    if (currentPhase === WorkflowPhase.INITIAL) {
      if (!handleInitialChoice(text)) {
        // User typed something else, ask them to choose
        addMessage("I can help you with either a Webpage Redesign or creating a New Webpage from Scratch. Which one are you looking for?", MessageSender.BOT);
      }
    } else if (isNewWebsitePhase(currentPhase)) {
      // Handle New Website questionnaire responses
      handleNewWebsiteResponse(text, false);
    } else if (isRedesignPhase(currentPhase)) {
      // Handle Website Redesign questionnaire responses
      handleRedesignResponse(text);
    }
  };

  const handleQuickAction = (text: string) => {
    const currentQuestion = getCurrentQuestion();
    const isMultiSelect = currentQuestion?.phase === 'RedesignIssues';
    const isDoneOption = text.startsWith('Done selecting');
    const isOtherOptionSelected = isOtherOption(text);
    
    // For multi-select questions, only add message for "Done" or "Other" (which prompts for input)
    // Regular option toggles should be silent (no message added)
    if (isMultiSelect && !isDoneOption && !isOtherOptionSelected) {
      // Silent toggle - just update state without adding message
      handleRedesignResponse(text);
      return;
    }
    
    // For all other cases, add the message first
    addMessage(text, MessageSender.USER);
    
    if (currentPhase === WorkflowPhase.INITIAL) {
      handleInitialChoice(text);
    } else if (isNewWebsitePhase(currentPhase)) {
      // Handle New Website questionnaire quick actions
      handleNewWebsiteResponse(text, true);
    } else if (isRedesignPhase(currentPhase)) {
      // Handle Website Redesign questionnaire quick actions
      handleRedesignResponse(text);
    }
  };

  const getCurrentQuestionOptions = () => {
    // Don't show quick actions when waiting for "Other" input
    if (userResponses.waitingForOtherInput) {
      return [];
    }
    
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return [];
    
    const options = currentQuestion.options || [];
    
    // ReferencesAndCompetitors uses custom component, not quick actions
    
    return options;
  };

  const shouldShowQuickActions = () => {
    // Don't show quick actions when waiting for "Other" input
    if (userResponses.waitingForOtherInput) {
      return false;
    }
    
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return false;
    
    // Show quick actions for quick/yesno questions, and also for text questions with options (like "I don't have any")
    if (currentQuestion.type === 'quick' || currentQuestion.type === 'yesno') {
      return true;
    }
    
    // Show quick actions for text questions that have options (e.g., "I don't have any")
    if (currentQuestion.type === 'text' && currentQuestion.options && currentQuestion.options.length > 0) {
      return true;
    }
    
    // ReferencesAndCompetitors uses custom component, not quick actions
    
    return false;
  };

  const getCurrentQuestionPlaceholder = () => {
    const currentQuestion = getCurrentQuestion();
    return currentQuestion?.placeholder || "Type your message...";
  };

  const getSelectedOptions = (): string[] => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return [];

    // For multi-select questions, parse the stored response
    if (currentQuestion.phase === 'RedesignIssues') {
      if (userResponses.redesignIssues) {
        const selected = parseMultiSelect(userResponses.redesignIssues);
        return normalizeMultiSelectForDisplay(selected);
      }
    }

    // For single-select questions, return the selected option if it exists
    // This could be extended for other question types in the future
    return [];
  };

  const shouldShowInputBar = () => {
    if (sessionClosed) {
      return false;
    }
    
    // Hide input bar in initial phase when quick actions are available
    if (currentPhase === WorkflowPhase.INITIAL) {
      return false; // Only quick action buttons are shown, no input needed
    }
    
    // Hide input bar for references/competitors question (uses custom component)
    const currentQuestion = getCurrentQuestion();
    if (currentQuestion && isReferencesAndCompetitorsPhase(currentQuestion.phase)) {
      return false;
    }
    
    // Show input bar when waiting for "Other" input
    if (userResponses.waitingForOtherInput) {
      return true;
    }
    
    // Show input bar for text-type questions (free-form input required)
    if (currentQuestion && currentQuestion.type === 'text') {
      return true;
    }
    
    // Hide input bar for quick/yesno questions (only buttons needed)
    return false;
  };

  const handleFileUpload = (files: File[]) => {
    if (files.length === 0) {
      addMessage("No files were selected. Please try again or choose 'Describe in Text' instead.", MessageSender.BOT);
      return;
    }
    
    try {
      const updatedResponses = { ...userResponses };
      
      // Determine which flow we're in and update the appropriate field
      if (currentFlow === 'redesign') {
        updatedResponses.redesignBrandFiles = files;
      } else {
        updatedResponses.brandFiles = files;
      }
      
      setUserResponses(updatedResponses);
      setShowFileUpload(false);
      
      // Show confirmation
      addMessage(`Great! I've received ${files.length} file(s). Thank you for sharing your brand guidelines!`, MessageSender.BOT);
      
      // Move to next question
      setTimeout(() => {
        moveToNextQuestion(updatedResponses);
      }, 500);
    } catch (error) {
      logger.error("Error handling file upload:", error);
      addMessage("There was an error processing your files. Please try again or choose 'Describe in Text' instead.", MessageSender.BOT);
    }
  };

  const captureWebpageScreenshotAndLog = async (url: string) => {
    try {
      const apiKey = getAndValidateApiKey();

    // Validate API key
      if (!apiKey) {
        logger.error('Gemini API key is required for screenshot analysis');
        resetScreenshotState();
      addMessage(
          buildMissingApiKeyMessage('analyze your webpage screenshot'),
        MessageSender.BOT
      );
        return;
      }

      // Update progress text
      setScreenshotProgressText('Analyzing your page');
      
      // Small delay to show the first message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update progress text
      setScreenshotProgressText('Reviewing your page');
      
      // Capture the webpage screenshot
      const imageBuffer = await captureWebpageScreenshot(url);
      
      // Convert ArrayBuffer to binary string
      const binaryString = arrayBufferToBinaryString(imageBuffer);
      
      // Convert ArrayBuffer to Uint8Array for byte-level inspection
      const bytes = new Uint8Array(imageBuffer);
      
      // Debug log the binary result (dev only)
      logger.debug('=== Webpage Screenshot Binary Data ===');
      logger.debug('URL:', url);
      logger.debug('Binary string length:', binaryString.length, 'characters');
      logger.debug('Buffer size:', imageBuffer.byteLength, 'bytes');
      logger.debug('First 100 bytes:', Array.from(bytes.slice(0, 100)));
      
      // Convert image to base64 for Gemini API
      const imageBase64 = arrayBufferToBase64(imageBuffer);
      
      // Send screenshot to Gemini AI for UI/UX audit
      const auditResponse = await analyzeScreenshotWithGemini(
        imageBase64,
        UI_UX_AUDIT_PROMPT,
        apiKey
      );
      
      // Debug log the Gemini response (dev only)
      logger.debug('=== Gemini UI/UX Audit Response ===');
      logger.debug(auditResponse);
      
      // Parse the audit response to extract issues
      const issues = parseAuditResponse(auditResponse);
      
      // Hide loader after binary is logged and Gemini response is received
      resetScreenshotState();
      
      // Display audit issues instead of completion message
      if (issues.length > 0) {
        const auditMessage: Message = {
          id: `audit-${Date.now()}`,
          text: 'I\'ve completed the UI/UX audit of your webpage. Here are the high-impact issues I identified:',
          sender: MessageSender.BOT,
          auditIssues: issues,
          isAuditMessage: true,
        };
        setMessages((prev) => [...prev, auditMessage]);
      } else {
        // Fallback message if no issues were parsed
        // This could happen if the response format was unexpected
        logger.warn('No issues parsed from audit response. Response:', auditResponse);
        addMessage(
          'I\'ve completed the UI/UX audit of your webpage. The analysis didn\'t identify any critical issues, or the response format was unexpected.',
          MessageSender.BOT
        );
      }
    } catch (error: any) {
      logger.error('Error capturing webpage screenshot or analyzing with Gemini:', error);
      resetScreenshotState();
      addMessage(buildUserFriendlyErrorMessage(error, 'analyzing your webpage'), MessageSender.BOT);
    }
  };

  const handleAuditContinue = async () => {
    // User chose to move forward; generate the redesigned webpage now
    // Validate that we have the necessary information
    if (!userResponses.redesignAudience) {
      addMessage(
        "I'm missing some information needed to generate your redesigned webpage. Please refresh and try again.",
        MessageSender.BOT
      );
      return;
    }
    
    // Start the generation process with a 1-minute delay to space out API calls
    // This helps avoid rate limit issues after the analysis step
    await generateRedesignHtmlWithDelay();
  };

  const generateRedesignHtmlWithDelay = async () => {
    // Use selected provider for redesign generation (Gemini still used for analysis)
    const providerConfig = (() => {
      if (designProvider === 'anthropic') {
        return {
          key: getAndValidateAnthropicApiKey(),
          missingMsg: buildMissingApiKeyMessage('generate your redesigned webpage', false, true),
          fn: generateHtmlWithAnthropic,
        };
      }
      if (designProvider === 'openai') {
        return {
          key: getAndValidateOpenAIApiKey(),
          missingMsg: buildMissingApiKeyMessage('generate your redesigned webpage', true, false),
          fn: generateHtmlWithOpenAI,
        };
      }
      // default to Gemini for generation if selected
      return {
        key: getAndValidateApiKey(),
        missingMsg: buildMissingApiKeyMessage('generate your redesigned webpage', false, false),
        fn: generateHtmlWithGemini,
      };
    })();

    if (!providerConfig.key) {
      addMessage(providerConfig.missingMsg, MessageSender.BOT);
      return;
    }

    // Show loader immediately
    setIsGeneratingHtml(true);
    setIsLoading(true);

    try {
      // 1-minute delay to space out API calls and avoid rate limits
      // Show countdown/progress messages during the wait
      const delayMs = 60000; // 1 minute
      const updateInterval = 10000; // Update message every 10 seconds
      const startTime = Date.now();
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.ceil((delayMs - elapsed) / 1000);
        
        if (remaining > 0) {
          setGenerationProgressText(`Preparing to generate your redesigned webpage... (${remaining}s)`);
        } else {
          setGenerationProgressText('Preparing to generate your redesigned webpage...');
        }
      };

      // Update progress immediately
      updateProgress();
      
      // Update progress every 10 seconds during the wait
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed < delayMs) {
          updateProgress();
        } else {
          clearInterval(progressInterval);
        }
      }, updateInterval);

      // Wait for the delay period
      await new Promise(resolve => setTimeout(resolve, delayMs));
      clearInterval(progressInterval);

      // Now proceed with generation
      await generateRedesignHtml(providerConfig.key, providerConfig.fn);
    } catch (error: any) {
      logger.error('Error in delayed generation process:', error);
      addMessage(buildUserFriendlyErrorMessage(error, 'generating your redesigned webpage'), MessageSender.BOT);
      resetGenerationState();
    }
  };

  const generateRedesignHtml = async (apiKey: string, generateFn: (prompt: string, apiKey: string) => Promise<string>) => {
    try {
      // Build the redesign prompt from redesign-specific inputs
      const fullPrompt = buildRedesignPrompt(userResponses);

      // Generate HTML using selected provider (Gemini/OpenAI/Anthropic) for redesign route
      setGenerationProgressText('Connecting to AI...');
      const rawResponse = await generateFn(fullPrompt, apiKey);

      // Process HTML
      setGenerationProgressText('Processing HTML...');
      const extractionResult = extractHtmlFromResponse(rawResponse);

      if (!extractionResult.success) {
        throw new Error(extractionResult.error || 'Failed to extract HTML from response');
      }

      // Add success message with HTML preview
      const htmlMessage: Message = {
        id: `html-redesign-${Date.now()}`,
        text: "Your redesigned webpage is ready! Here's a preview:",
        sender: MessageSender.BOT,
        htmlContent: extractionResult.html,
        isHtmlMessage: true,
      };
      setMessages((prev) => [...prev, htmlMessage]);
      enqueueRatingPrompt();
    } catch (error: any) {
      logger.error('Error generating redesigned HTML:', error);
      addMessage(buildUserFriendlyErrorMessage(error, 'generating your redesigned webpage'), MessageSender.BOT);
    } finally {
      resetGenerationState();
    }
  };

  const generateHtml = async () => {
    // Use selected provider for scratch route generation
    const providerConfig = (() => {
      if (designProvider === 'anthropic') {
        return {
          key: getAndValidateAnthropicApiKey(),
          missingMsg: buildMissingApiKeyMessage('generate your webpage', false, true),
          fn: generateHtmlWithAnthropic,
        };
      }
      if (designProvider === 'openai') {
        return {
          key: getAndValidateOpenAIApiKey(),
          missingMsg: buildMissingApiKeyMessage('generate your webpage', true, false),
          fn: generateHtmlWithOpenAI,
        };
      }
      return {
        key: getAndValidateApiKey(),
        missingMsg: buildMissingApiKeyMessage('generate your webpage', false, false),
        fn: generateHtmlWithGemini,
      };
    })();

    // Validate API key
    if (!providerConfig.key) {
      addMessage(providerConfig.missingMsg, MessageSender.BOT);
      return;
    }

    // Validate required fields
    if (!userResponses.pageType) {
      addMessage(
        "I'm missing some information needed to generate your webpage. Please refresh and try again.",
        MessageSender.BOT
      );
      return;
    }

    setIsGeneratingHtml(true);
    setIsLoading(true);

    try {
      // Build the prompt (keeping the same prompt as before)
      const commonPrompt = buildCommonPrompt(userResponses);
      const pageTypePrompt = getPageTypePrompt(userResponses.pageType);
      const fullPrompt = buildFullPrompt(commonPrompt, pageTypePrompt);

      // Generate HTML
      setGenerationProgressText('Connecting to AI...');
      const rawResponse = await providerConfig.fn(fullPrompt, providerConfig.key);

      // Process HTML
      setGenerationProgressText('Processing HTML...');
      const extractionResult = extractHtmlFromResponse(rawResponse);

      if (!extractionResult.success) {
        throw new Error(extractionResult.error || 'Failed to extract HTML from response');
      }

      // Add success message with HTML preview
      const htmlMessage: Message = {
        id: `html-${Date.now()}`,
        text: "Your webpage is ready! Here's a preview:",
        sender: MessageSender.BOT,
        htmlContent: extractionResult.html,
        isHtmlMessage: true,
      };
      setMessages((prev) => [...prev, htmlMessage]);
      enqueueRatingPrompt();
    } catch (error: any) {
      logger.error('Error generating HTML:', error);
      addMessage(buildUserFriendlyErrorMessage(error, 'generating your webpage'), MessageSender.BOT);
    } finally {
      resetGenerationState();
    }
  };
  
  return { 
    messages, 
    sendMessage, 
    isLoading, 
    currentPhase, 
    handleQuickAction,
    getCurrentQuestionOptions,
    shouldShowQuickActions,
    getCurrentQuestionPlaceholder,
    shouldShowInputBar,
    userResponses,
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
    sessionClosed
  };
};

export default useChat;
