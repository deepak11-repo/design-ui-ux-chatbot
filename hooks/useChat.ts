
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
import { loadChatState, saveChatState, clearChatState, getSessionCount, incrementSessionCount, isSessionLimitReached } from '../utils/storage';
import { getOrCreateSessionId, getSessionStartTimestamp, setSessionStartTimestamp, clearSessionData } from '../utils/sessionId';
import { formatSessionDataForGoogleChat, formatSessionDataAsGoogleChatCard } from '../utils/googleChatFormatter';
import { sendSessionRecordToGoogleChat } from '../utils/webhookSender';
import { VALIDATION_MESSAGES, OTHER_INPUT_MESSAGES } from '../constants/messages';
import { 
  isIDontHaveAny, 
  validateNonEmpty, 
  parseMultiSelect, 
  joinMultiSelect, 
  toggleMultiSelectOption,
  normalizeMultiSelectForDisplay
} from '../utils/responseHelpers';
import { validateAndTrim } from '../utils/responseValidation';
import { extractJsonFromResponse } from '../utils/jsonValidator';
import { analyzeScreenshotWithGemini, generateRedesignSpecificationWithGemini } from '../services/ai/geminiService';
import { generateSpecificationWithSonnet, generateHtmlFromSpecificationWithFallback, generateRedesignSpecificationWithSonnet, generateHtmlFromRedesignSpecificationWithFallback } from '../services/ai/anthropic';
import { REDESIGN_SPECIFICATION_SYSTEM_PROMPT, buildRedesignSpecificationUserPrompt, buildRedesignSpecificationPromptForGemini } from '../services/prompts/anthropic/redesignSpecificationPrompt';
import { NEW_WEBSITE_SYSTEM_PROMPT, buildNewWebsiteUserPrompt } from '../services/prompts/newWebsiteSpecPrompt';
import { processHtmlResponse } from '../utils/htmlResponseHandler';
import { captureWebpageScreenshotWithText } from '../services/api/apiflashService';
import { arrayBufferToBase64 } from '../utils/binaryUtils';
import { UI_UX_AUDIT_PROMPT } from '../services/prompts/uiUxAuditPrompt';
import { parseAuditResponse } from '../utils/auditParser';
import { getAndValidateApiKey, getAndValidateAnthropicApiKey, buildMissingApiKeyMessage, STANDARD_ERROR_MESSAGE } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import { parseReferencesString } from '../utils/referenceParser';
import { processReferenceWebsites } from '../services/api/referenceWebsiteService';
import { addModelCallDelay } from '../utils/modelCallDelay';
import { getLoaderMessage, LoaderType } from '../utils/loaderMessages';

const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE_1, WELCOME_MESSAGE_2]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>(WorkflowPhase.INITIAL);
  const [userResponses, setUserResponses] = useState<UserResponses>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentFlow, setCurrentFlow] = useState<'newWebsite' | 'redesign' | null>(null);
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);
  const [generationProgressText, setGenerationProgressText] = useState(() => getLoaderMessage('generating_html_new'));
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotProgressText, setScreenshotProgressText] = useState(() => getLoaderMessage('reviewing_page'));
  const [sessionClosed, setSessionClosed] = useState(false);
  const [ratingRequested, setRatingRequested] = useState(false);
  const [ratingCompleted, setRatingCompleted] = useState(false);
  const [ratingScore, setRatingScore] = useState<number | null>(null);
  // Store screenshot base64 in memory only (not in userResponses to avoid localStorage quota issues)
  const [redesignScreenshotBase64, setRedesignScreenshotBase64] = useState<string | null>(null);
  // Session limit tracking (derived from localStorage)
  const [sessionLimitReached, setSessionLimitReached] = useState<boolean>(() => isSessionLimitReached());
  
  // Helper function to reset generation state
  const resetGenerationState = () => {
    setIsGeneratingHtml(false);
    setIsLoading(false);
    setGenerationProgressText(getLoaderMessage('generating_html_new'));
  };
  
  // Helper function to reset screenshot state
  const resetScreenshotState = () => {
    setIsCapturingScreenshot(false);
    setScreenshotProgressText(getLoaderMessage('reviewing_page'));
    // redesignScreenshotBase64 is cleared after specification generation completes
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

  /**
   * Centralized error handler for all errors in the chatbot
   * Shows a user-friendly error message and displays email prompt
   * Session will close after user submits their email
   * @param error - The error object (for logging purposes)
   * @param context - Optional context for logging (e.g., "generating your webpage")
   */
  const handleError = (error: any, context?: string) => {
    // Log the error for debugging (but don't show technical details to user)
    if (context) {
      logger.error(`Error ${context}:`, error);
    } else {
      logger.error('Error encountered:', error);
    }

    // Reset any loading/generation states
    resetGenerationState();
    resetScreenshotState();
    setIsLoading(false);

    // Show user-friendly error message
    addMessage(STANDARD_ERROR_MESSAGE, MessageSender.BOT);

    // Show email prompt so user can get assistance
    // Session will close after email is submitted (handled in handleEmailSubmit)
    addMessage(
      'Please provide your email so that our agent can personally assist you.',
      MessageSender.BOT,
      { isEmailPrompt: true }
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

  const handleEmailSubmit = async (email: string) => {
    if (sessionClosed) return;
    addMessage(email, MessageSender.USER);
    addMessage(
      'Thanks! An engineer will connect with you shortly. Closing the session now.',
      MessageSender.BOT
    );
    setSessionClosed(true);
    
    // Check if session limit will be reached after this session
    const currentCount = getSessionCount();
    if (currentCount >= 1) {
      // After this session closes, user will have used 2 sessions
      setSessionLimitReached(true);
    }

    // Send session record to Google Chat webhook
    try {
      const sessionStartTimestamp = getSessionStartTimestamp() || new Date().toISOString();
      
      // Get audit issues from messages (for redesign route)
      let auditIssues: string[] = [];
      if (currentFlow === 'redesign') {
        const auditMessage = messages.find(msg => msg.isAuditMessage && msg.auditIssues);
        if (auditMessage && auditMessage.auditIssues) {
          auditIssues = auditMessage.auditIssues;
        }
      }

      // Get feedback from messages (if rating < 4, user provided feedback)
      let feedback: string | null = null;
      if (ratingScore !== null && ratingScore < 4) {
        // Find the feedback message (user message after feedback prompt)
        const feedbackPromptIndex = messages.findIndex(msg => msg.isFeedbackPrompt);
        if (feedbackPromptIndex >= 0 && feedbackPromptIndex < messages.length - 1) {
          const feedbackMessage = messages[feedbackPromptIndex + 1];
          if (feedbackMessage && feedbackMessage.sender === MessageSender.USER && feedbackMessage.text) {
            feedback = feedbackMessage.text;
          }
        }
      }

      // Get pageTypeOther from userResponses if pageType contains "Other:"
      let pageTypeOther: string | null = null;
      if (currentFlow === 'newWebsite' && userResponses.pageType && userResponses.pageType.startsWith('Other: ')) {
        pageTypeOther = userResponses.pageType.replace('Other: ', '');
      }

      // Format session data (pass pageTypeOther if available)
      const sessionData = formatSessionDataForGoogleChat(
        currentFlow || 'newWebsite',
        userResponses,
        email,
        sessionStartTimestamp,
        ratingScore,
        feedback,
        auditIssues.length > 0 ? auditIssues : undefined,
        pageTypeOther
      );

      // Convert to Google Chat card format
      const googleChatPayload = formatSessionDataAsGoogleChatCard(sessionData);

      // Send to webhook (async, don't block UI)
      sendSessionRecordToGoogleChat(googleChatPayload).catch((error) => {
        logger.error('Error sending session record to Google Chat:', error);
        // Don't block session closure on webhook failure
      });
    } catch (error: any) {
      logger.error('Error preparing session record for Google Chat:', error);
      // Don't block session closure on error
    }
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


  useEffect(() => {
    // Check session limit on initialization
    const limitReached = isSessionLimitReached();
    setSessionLimitReached(limitReached);

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
      logger.error(`Invalid question index: ${currentQuestionIndex} for flow: ${currentFlow}`);
      return null;
    }

    const question = questions[questionKey];
    if (!question) {
      logger.error(`Question not found for key: ${questionKey} in flow: ${currentFlow}`);
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
        // Trigger HTML generation with fresh responses
        generateHtml(updatedResponses);
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
          setScreenshotProgressText(getLoaderMessage('reviewing_page'));
          // Pass responsesToCheck to ensure reference website analysis uses fresh data
          // (React state updates are async, so userResponses might be stale)
          captureWebpageScreenshotAndLog(responsesToCheck.redesignCurrentUrl, responsesToCheck);
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
          handleError(new Error(`Redesign question navigation failed at index ${nextIndex}`), 'navigating to next question');
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
      const trimmed = validateAndTrim(response, VALIDATION_MESSAGES.business, addMessage);
      if (!trimmed) return;
      updatedResponses.business = trimmed;
    } else if (currentQuestion.phase === 'NewWebsiteAudience') {
      const trimmed = validateAndTrim(response, VALIDATION_MESSAGES.audience, addMessage);
      if (!trimmed) return;
      updatedResponses.audience = trimmed;
    } else if (currentQuestion.phase === 'NewWebsiteGoals') {
      const trimmed = validateAndTrim(response, VALIDATION_MESSAGES.goals, addMessage);
      if (!trimmed) return;
      updatedResponses.goals = trimmed;
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
        const trimmed = validateAndTrim(response, VALIDATION_MESSAGES.brandDetails, addMessage);
        if (!trimmed) return;
        updatedResponses.brandDetails = trimmed;
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
      const trimmed = validateAndTrim(response, VALIDATION_MESSAGES.audience, addMessage);
      if (!trimmed) {
        setUserResponses(updatedResponses);
        return;
      }
      updatedResponses.redesignAudience = trimmed;
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

  /**
   * Starts a flow with the given configuration
   * @param flowType - The type of flow to start
   * @param welcomeMessage - The welcome message to show
   * @param questions - The questions object for the flow
   * @param questionOrder - The question order array for the flow
   */
  const startFlow = (
    flowType: 'newWebsite' | 'redesign',
    welcomeMessage: string,
    questions: Record<string, any>,
    questionOrder: string[]
  ) => {
    // Generate session ID and set start timestamp when flow starts
    getOrCreateSessionId();
    setSessionStartTimestamp();
    
    addMessage(welcomeMessage, MessageSender.BOT);
    setTimeout(() => {
      try {
        setCurrentQuestionIndex(0);
        setCurrentFlow(flowType);
        // Clear screenshot from previous redesign flow when starting a new flow
        setRedesignScreenshotBase64(null);
        const firstQuestion = questions[questionOrder[0]];
        
        if (!firstQuestion) {
          handleError(new Error(`First question not found in ${flowType} flow`), 'starting the flow');
          return;
        }
        
        setCurrentPhase(getPhaseFromString(firstQuestion.phase));
        const isRefsAndCompetitors = isReferencesAndCompetitorsPhase(firstQuestion.phase);
        addMessage(firstQuestion.question, MessageSender.BOT, { isReferencesAndCompetitorsPrompt: isRefsAndCompetitors });
      } catch (error: any) {
        handleError(error, `starting ${flowType} flow`);
      }
    }, 500);
  };

  const startNewWebsiteFlow = () => {
    startFlow(
      'newWebsite',
      "Excellent! Creating a new webpage from scratch is exciting. Let me ask you a few questions to understand your needs better.",
      NEW_WEBSITE_QUESTIONS,
      NEW_WEBSITE_QUESTION_ORDER
    );
  };

  const startRedesignFlow = () => {
    startFlow(
      'redesign',
      "Great! I'd be happy to help you with your webpage redesign. Let me ask you a few questions to understand your current webpage and what you're aiming for.",
      REDESIGN_WEBSITE_QUESTIONS,
      REDESIGN_WEBSITE_QUESTION_ORDER
    );
  };

  /**
   * Checks if text matches redesign keywords
   */
  const isRedesignChoice = (text: string, normalizedText: string): boolean => {
    const redesignKeywords = ['redesign', 'webpage redesign', 'website redesign'];
    const exactMatches = ['Webpage Redesign', 'Website Redesign'];
    return redesignKeywords.some(keyword => normalizedText.includes(keyword)) || 
           exactMatches.includes(text);
  };

  /**
   * Checks if text matches new website keywords
   */
  const isNewWebsiteChoice = (text: string, normalizedText: string): boolean => {
    const newWebsiteKeywords = ['new webpage', 'new website', 'from scratch', 'scratch'];
    const exactMatches = ['New Webpage from Scratch', 'New Website from Scratch'];
    return newWebsiteKeywords.some(keyword => normalizedText.includes(keyword)) || 
           exactMatches.includes(text);
  };

  const handleInitialChoice = (text: string): boolean => {
    const normalizedText = text.toLowerCase().trim();
    
    if (isRedesignChoice(text, normalizedText)) {
      startRedesignFlow();
      return true;
    } else if (isNewWebsiteChoice(text, normalizedText)) {
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


  /**
   * Processes reference websites silently (no UI updates)
   * @param referencesString - The stored references string from userResponses
   * @param apiKey - The Gemini API key (must be validated before calling)
   * @param flowName - Name of the flow for logging purposes
   * @param storageKey - Key to store results in userResponses ('referenceWebsiteAnalysis' or 'redesignReferenceWebsiteAnalysis')
   * @returns Promise that resolves with array of analysis results (or empty array if none)
   */
  const processReferenceWebsitesSilently = async (
    referencesString: string | undefined,
    apiKey: string,
    flowName: string,
    storageKey: 'referenceWebsiteAnalysis' | 'redesignReferenceWebsiteAnalysis'
  ): Promise<any[]> => {
    try {
      // Validate API key
      if (!apiKey || !apiKey.trim()) {
        return [];
      }

      if (!referencesString || !referencesString.trim()) {
        // No reference websites provided, skip processing
        return [];
      }

      const entries = parseReferencesString(referencesString);
      if (entries.length === 0) {
        // No valid entries found
        return [];
      }

      // Process reference websites sequentially (silently, no UI updates)
      const results = await processReferenceWebsites(entries, apiKey);

      // Store results silently (only successful ones are returned)
      if (results.length > 0) {
        setUserResponses((prev) => {
          const updated = {
            ...prev,
            [storageKey]: results,
          };
          return updated;
        });
      }

      return results;
    } catch (error: any) {
      // Log error but don't show to user (silent processing)
      logger.error(`Error processing reference websites for ${flowName}:`, error);
      return [];
    }
  };

  /**
   * Processes reference websites for redesign flow (silently, before UI audit)
   * @param apiKey - The Gemini API key
   * @param responses - Optional UserResponses object to use instead of state (for fresh data)
   * @returns Array of analysis results (or empty array if none)
   */
  const processReferenceWebsitesForRedesign = async (apiKey: string, responses?: UserResponses): Promise<any[]> => {
    // Use provided responses if available, otherwise fall back to state
    // This is important because React state updates are async, and we need fresh data
    const referencesString = responses?.redesignReferencesAndCompetitors ?? userResponses.redesignReferencesAndCompetitors;
    
    
    return await processReferenceWebsitesSilently(
      referencesString,
      apiKey,
      'redesign',
      'redesignReferenceWebsiteAnalysis'
    );
  };

  /**
   * Processes reference websites for new website flow (silently, before HTML generation)
   * @param apiKey - The Gemini API key
   * @param responses - Optional fresh user responses (to avoid stale state issues)
   * @returns Array of analysis results (or empty array if none)
   */
  const processReferenceWebsitesForNewWebsite = async (apiKey: string, responses?: UserResponses): Promise<any[]> => {
    // Use provided responses or fallback to state
    // This is important because React state updates are async, and we need fresh data
    const responsesToUse = responses || userResponses;
    const referencesString = responsesToUse.referencesAndCompetitors;
    
    
    return await processReferenceWebsitesSilently(
      referencesString,
      apiKey,
      'new website',
      'referenceWebsiteAnalysis'
    );
  };

  const captureWebpageScreenshotAndLog = async (url: string, responses?: UserResponses) => {
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
      setScreenshotProgressText(getLoaderMessage('analyzing_references'));
      
      // Small delay to show the first message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Process reference websites first (silently, while loader is showing)
      // Process reference websites before UI audit (pass responses to avoid stale state)
      // Check if there are reference websites to process (to determine if we'll make Gemini calls)
      const responsesToCheck = responses || userResponses;
      const referencesString = responsesToCheck.redesignReferencesAndCompetitors;
      const hasReferenceWebsites = referencesString && referencesString.trim().length > 0;
      
      try {
        await processReferenceWebsitesForRedesign(apiKey, responses);
      } catch (error: any) {
        logger.error('Reference website analysis failed, continuing with UI audit:', error);
      }
      
      // Add delay between consecutive Gemini calls (reference websites → UI audit)
      if (hasReferenceWebsites) {
        await addModelCallDelay('gemini', 'gemini');
      }
      
      // Update progress text for UI audit
      setScreenshotProgressText(getLoaderMessage('reviewing_page'));
      
      // Capture the webpage screenshot (with text extraction if reuse content is requested)
      const shouldExtractText = userResponses.redesignReuseContent === true;
      const screenshotResult = await captureWebpageScreenshotWithText(url, shouldExtractText);
      
      const imageBuffer = screenshotResult.image;
      
      
      // Store extracted text if available (even though not currently used in prompt)
      if (screenshotResult.text) {
        setUserResponses((prev) => ({
          ...prev,
          redesignExtractedText: screenshotResult.text,
        }));
      }
      
      // Convert image to base64 for Gemini API (do not convert to binary)
      const imageBase64 = arrayBufferToBase64(imageBuffer);
      
      // Store screenshot base64 in state and use local variable to avoid closure issues
      setRedesignScreenshotBase64(imageBase64);
      
      
      // Send screenshot to Gemini for UI/UX audit (image only, extracted text is stored separately for content reuse)
      const auditResponse = await analyzeScreenshotWithGemini(
        imageBase64,
        UI_UX_AUDIT_PROMPT,
        apiKey
      );
      
      
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
        addMessage(
          'I\'ve completed the UI/UX audit of your webpage. The analysis didn\'t identify any critical issues, or the response format was unexpected.',
          MessageSender.BOT
        );
      }
      
      // Automatically proceed with specification and HTML generation (no button click required)
      // Validate that we have the necessary information
      if (!userResponses.redesignAudience) {
        return;
      }
      
      // Validate Gemini API key (using Gemini for specification generation due to context length limitations)
      const geminiApiKeyForSpec = getAndValidateApiKey();
      if (!geminiApiKeyForSpec) {
        addMessage(
          buildMissingApiKeyMessage('generate redesign specification'),
          MessageSender.BOT
        );
        return;
      }

      // Add 5-second delay before specification generation (Gemini → Gemini, same model)
      await addModelCallDelay('gemini', 'gemini');

      // Show loader for specification generation
      setIsGeneratingHtml(true);
      setGenerationProgressText(getLoaderMessage('generating_spec_redesign'));
      
      try {
        // Prepare updated responses that include extracted text (if available)
        // Use the extracted text from screenshotResult if reuse content was requested
        const responsesWithExtractedText = {
          ...userResponses,
          ...(screenshotResult.text && { redesignExtractedText: screenshotResult.text }),
        };
        
        // Log if extracted text is being included for content reuse
        if (userResponses.redesignReuseContent === true && screenshotResult.text) {
        } else if (userResponses.redesignReuseContent === true && !screenshotResult.text) {
        }
        
        // Build combined prompt for Gemini (system + user prompt combined)
        // Pass responses with extracted text to ensure content reuse works correctly
        const prompt = buildRedesignSpecificationPromptForGemini(responsesWithExtractedText);
        
        // Use the local variable (imageBase64) instead of state to avoid closure issues
        // The screenshot was captured earlier in this function and stored in imageBase64
        const screenshotBase64 = imageBase64;
        
        if (!screenshotBase64) {
          addMessage(
            'Screenshot not available. Please refresh and try the redesign flow again.',
            MessageSender.BOT
          );
          resetGenerationState();
          return;
        }
        
        // Call Gemini with combined prompt and screenshot image
        const specificationResponse = await generateRedesignSpecificationWithGemini(
          prompt,
          screenshotBase64,
          geminiApiKeyForSpec
        );
        
        // Clear screenshot from memory immediately after successful API call (no longer needed)
        setRedesignScreenshotBase64(null);
        
        // Extract and clean JSON from response (remove markdown code blocks if present)
        const cleanedResponse = extractJsonFromResponse(specificationResponse) || specificationResponse;
        
        // Output the cleaned response to console
        
        
        // Validate Anthropic API key for HTML generation (using Claude Opus with Sonnet fallback)
        const anthropicApiKey = getAndValidateAnthropicApiKey();
        if (!anthropicApiKey) {
          addMessage(
            buildMissingApiKeyMessage('generate redesigned webpage HTML', true),
            MessageSender.BOT
          );
          resetGenerationState();
          setRedesignScreenshotBase64(null);
          return;
        }
        
        // No delay needed: Gemini → Claude (different models)
        // Generate HTML immediately from the redesign specification
        setGenerationProgressText(getLoaderMessage('generating_html_redesign'));
        
        try {
          // Call Claude (Opus with Sonnet fallback) with the redesign specification JSON
          const htmlResponse = await generateHtmlFromRedesignSpecificationWithFallback(
            cleanedResponse,
            anthropicApiKey
          );
          
          // Extract HTML from response
          setGenerationProgressText(getLoaderMessage('processing_html'));
          const htmlResult = processHtmlResponse(
            htmlResponse,
            "Your redesigned webpage is ready! Here's a preview:"
          );
          
          if (!htmlResult.success || !htmlResult.message) {
            throw new Error(htmlResult.error || 'Failed to extract HTML from response');
          }
          
          // Add success message with HTML preview
          setMessages((prev) => [...prev, htmlResult.message!]);
          enqueueRatingPrompt();
          
        } catch (htmlError: any) {
          handleError(htmlError, 'generating redesigned webpage HTML');
        }
      } catch (error: any) {
        // Clear screenshot from memory on error (to free up memory)
        setRedesignScreenshotBase64(null);
        handleError(error, 'generating redesign specification');
      } finally {
        resetGenerationState();
        // Ensure screenshot is cleared (safety net, should already be cleared above)
        setRedesignScreenshotBase64(null);
      }
    } catch (error: any) {
      resetScreenshotState();
      handleError(error, 'analyzing your webpage');
    }
  };

  // Kept for backward compatibility but redesign flow now proceeds automatically after audit
  const handleAuditContinue = async () => {
    // No-op: redesign flow proceeds automatically
  };


  const generateHtml = async (responses?: UserResponses) => {
    // Use provided responses or fallback to state (to avoid stale state issues)
    const responsesToUse = responses || userResponses;
    
    // Show loader for reference website analysis
    setIsGeneratingHtml(true);
    setGenerationProgressText(getLoaderMessage('analyzing_references'));
    
    // Process reference websites before HTML generation (optional, failures don't block flow)
    const apiKey = getAndValidateApiKey();
    let analysisResults: any[] = [];
    
    if (apiKey) {
      try {
        // Get results directly from the function (pass fresh responses to avoid React state timing issues)
        analysisResults = await processReferenceWebsitesForNewWebsite(apiKey, responsesToUse);
      } catch (error: any) {
        // Log error but continue to output any available results
        logger.error('Reference website analysis encountered errors:', error);
        // Try to get results from provided responses or state as fallback
        analysisResults = responsesToUse.referenceWebsiteAnalysis || userResponses.referenceWebsiteAnalysis || [];
      }
    } else {
      // No API key, but check if results already exist in provided responses or state
      analysisResults = responsesToUse.referenceWebsiteAnalysis || userResponses.referenceWebsiteAnalysis || [];
    }

    // Reference website analysis completed
    
    // Now execute Claude with the new prompt structure
    const anthropicApiKey = getAndValidateAnthropicApiKey();
    
    if (!anthropicApiKey) {
      logger.error('Anthropic API key is required for specification generation');
      resetGenerationState();
      addMessage(
        buildMissingApiKeyMessage('generate webpage specification', true),
        MessageSender.BOT
      );
      return;
    }

    // Ensure we have the latest analysis results in userResponses
    // Update state if we have fresh results that might not be in state yet
    if (analysisResults.length > 0) {
      setUserResponses((prev) => ({
        ...prev,
        referenceWebsiteAnalysis: analysisResults,
      }));
    }
    
    // Get the latest userResponses (with analysis results) for prompt building
    // Merge provided responses with analysis results
    const responsesForPrompt = analysisResults.length > 0
      ? { ...responsesToUse, referenceWebsiteAnalysis: analysisResults }
      : responsesToUse;
    
    // Build user prompt with all collected inputs
    const userPrompt = buildNewWebsiteUserPrompt(responsesForPrompt);
    
    
    // Update loader for specification generation
    setGenerationProgressText(getLoaderMessage('generating_spec_new'));
    
    try {
      // Call Claude (Sonnet) with system and user prompts
      const specificationResponse = await generateSpecificationWithSonnet(
        NEW_WEBSITE_SYSTEM_PROMPT,
        userPrompt,
        anthropicApiKey
      );
      
      // Extract and clean JSON from response (remove markdown code blocks if present)
      const cleanedResponse = extractJsonFromResponse(specificationResponse) || specificationResponse;
      
      // Output the cleaned response to console
      
      
      // Update progress text immediately after specification is received
      setGenerationProgressText(getLoaderMessage('preparing_html'));
      
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Wait 1 minute before generating HTML
      setGenerationProgressText(getLoaderMessage('preparing_html'));
      
      // Wait 60 seconds (1 minute) with progress updates
      const waitTime = 60000; // 60 seconds
      const updateInterval = 5000; // Update every 5 seconds
      const totalUpdates = waitTime / updateInterval;
      
      for (let i = 0; i < totalUpdates; i++) {
        await new Promise(resolve => setTimeout(resolve, updateInterval));
        const remainingSeconds = Math.ceil((waitTime - (i + 1) * updateInterval) / 1000);
        if (remainingSeconds > 0) {
          const baseMessage = getLoaderMessage('preparing_html');
          setGenerationProgressText(`${baseMessage} (${remainingSeconds}s remaining)`);
        }
      }
      
      // Now generate HTML from the specification
      setGenerationProgressText(getLoaderMessage('generating_html_new'));
      
      try {
        // Call Claude (Opus with Sonnet fallback) with the specification JSON
        const htmlResponse = await generateHtmlFromSpecificationWithFallback(cleanedResponse, anthropicApiKey);
        
        // Extract HTML from response
        setGenerationProgressText(getLoaderMessage('processing_html'));
        const htmlResult = processHtmlResponse(htmlResponse);
        
        if (!htmlResult.success || !htmlResult.message) {
          throw new Error(htmlResult.error || 'Failed to extract HTML from response');
        }
        
        // Add success message with HTML preview
        setMessages((prev) => [...prev, htmlResult.message!]);
        enqueueRatingPrompt();
        
      } catch (htmlError: any) {
        handleError(htmlError, 'generating your webpage');
      } finally {
        resetGenerationState();
      }
    } catch (error: any) {
      handleError(error, 'generating webpage specification');
    }
    
  };
  
  /**
   * Starts a new chat session by clearing state and incrementing session count
   * Checks session limit before allowing new session
   */
  const startNewChat = () => {
    // Check if session limit has been reached
    if (isSessionLimitReached()) {
      setSessionLimitReached(true);
      return;
    }

    // Clear chat state from localStorage
    clearChatState();

    // Clear session data (ID and timestamp)
    clearSessionData();

    // Increment session count
    const newCount = incrementSessionCount();

    // Check if limit reached after increment
    if (newCount >= 2) {
      setSessionLimitReached(true);
    }

    // Reset all state to initial values
    setMessages([WELCOME_MESSAGE_1, WELCOME_MESSAGE_2]);
    setCurrentPhase(WorkflowPhase.INITIAL);
    setUserResponses({});
    setCurrentQuestionIndex(0);
    setCurrentFlow(null);
    setSessionClosed(false);
    setIsGeneratingHtml(false);
    setIsLoading(false);
    setGenerationProgressText(getLoaderMessage('generating_html_new'));
    setIsCapturingScreenshot(false);
    setScreenshotProgressText(getLoaderMessage('reviewing_page'));
    setRatingRequested(false);
    setRatingCompleted(false);
    setRatingScore(null);
    setRedesignScreenshotBase64(null);
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
    startNewChat
  };
};

export default useChat;
