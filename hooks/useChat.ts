
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
import { hasUrls } from '../utils/validation';
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
import { generateHtmlWithGemini, analyzeScreenshotWithGemini } from '../services/ai/geminiService';
import { extractHtmlFromResponse } from '../services/ai/htmlProcessor';
import { captureWebpageScreenshot } from '../services/api/apiflashService';
import { arrayBufferToBinaryString, arrayBufferToBase64 } from '../utils/binaryUtils';
import { UI_UX_AUDIT_PROMPT } from '../services/prompts/uiUxAuditPrompt';
import { parseAuditResponse } from '../utils/auditParser';
import { buildUserFriendlyErrorMessage, getAndValidateApiKey, buildMissingApiKeyMessage } from '../utils/errorMessages';

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

  const addMessage = (text: string, sender: MessageSender) => {
    messageIdCounterRef.current += 1;
    const newMessage: Message = { 
      id: `${Date.now()}-${messageIdCounterRef.current}`, 
      text, 
      sender
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
      console.warn(`Invalid question index: ${currentQuestionIndex} for flow: ${currentFlow}`);
      return null;
    }

    const question = questions[questionKey];
    if (!question) {
      console.warn(`Question not found for key: ${questionKey} in flow: ${currentFlow}`);
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

      if (nextIndex >= NEW_WEBSITE_QUESTION_ORDER.length) {
        // All questions completed
        setCurrentPhase(WorkflowPhase.NEW_WEBSITE_COMPLETE);
        // Trigger HTML generation
        generateHtml();
      } else {
        const nextQuestionKey = NEW_WEBSITE_QUESTION_ORDER[nextIndex];
        const nextQuestion = NEW_WEBSITE_QUESTIONS[nextQuestionKey];
        
        if (!nextQuestion) {
          console.error(`Question not found for key: ${nextQuestionKey} at index ${nextIndex}`);
          addMessage("I encountered an error. Please refresh the page and try again.", MessageSender.BOT);
          return;
        }
        
        setCurrentQuestionIndex(nextIndex);
        setCurrentPhase(getPhaseFromString(nextQuestion.phase));
        addMessage(nextQuestion.question, MessageSender.BOT);
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
        const nextQuestionKey = REDESIGN_WEBSITE_QUESTION_ORDER[nextIndex];
        const nextQuestion = REDESIGN_WEBSITE_QUESTIONS[nextQuestionKey];
        
        if (!nextQuestion) {
          console.error(`Redesign question not found for key: ${nextQuestionKey} at index ${nextIndex}`);
          addMessage("I encountered an error. Please refresh the page and try again.", MessageSender.BOT);
          return;
        }
        
        setCurrentQuestionIndex(nextIndex);
        setCurrentPhase(getPhaseFromString(nextQuestion.phase));
        addMessage(nextQuestion.question, MessageSender.BOT);
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
      updatedResponses.hasBrand = isYesResponse(response);
      setUserResponses(updatedResponses);
      // Move to next question with updated responses to ensure correct skip logic
      moveToNextQuestion(updatedResponses);
      return;
    } else if (currentQuestion.phase === 'NewWebsiteBrandDetails') {
      // User chose upload or text method
      if (response === 'Upload Files') {
        updatedResponses.brandDetailsMethod = 'upload';
        setUserResponses(updatedResponses);
        setShowFileUpload(true);
        addMessage("Please upload your brand guideline files (logo, color palette, fonts, etc.). You can drag and drop files or click to browse.", MessageSender.BOT);
        return; // Wait for file upload
      } else if (response === 'Describe in Text') {
        updatedResponses.brandDetailsMethod = 'text';
        // Move to brandDetailsText question
        setUserResponses(updatedResponses);
        const textQuestionIndex = NEW_WEBSITE_QUESTION_ORDER.indexOf('brandDetailsText');
        if (textQuestionIndex !== -1) {
          const textQuestion = NEW_WEBSITE_QUESTIONS['brandDetailsText'];
          if (textQuestion) {
            setCurrentQuestionIndex(textQuestionIndex);
            setCurrentPhase(getPhaseFromString(textQuestion.phase));
            addMessage(textQuestion.question, MessageSender.BOT);
          } else {
            console.error('brandDetailsText question not found');
            addMessage("I encountered an error. Please refresh the page and try again.", MessageSender.BOT);
          }
        } else {
          console.error('brandDetailsText question index not found');
          addMessage("I encountered an error. Please refresh the page and try again.", MessageSender.BOT);
        }
        return;
      }
    } else if (currentQuestion.phase === 'NewWebsiteBrandDetails' && userResponses.brandDetailsMethod === 'text') {
      // This handles the text input for brand details (when phase is still NewWebsiteBrandDetails but method is text)
      const validationError = validateNonEmpty(response, VALIDATION_MESSAGES.brandDetails);
      if (validationError) {
        addMessage(validationError, MessageSender.BOT);
        return;
      }
      updatedResponses.brandDetails = response.trim();
    } else if (currentQuestion.phase === 'NewWebsiteInspirationLinks') {
      // Check if user selected "I don't have any"
      if (isIDontHaveAny(response)) {
        updatedResponses.inspirationLinks = '';
        updatedResponses.hasInspiration = false;
      } else {
        // Check for URLs
        if (hasUrls(response)) {
          updatedResponses.inspirationLinks = response;
          updatedResponses.hasInspiration = true;
        } else {
          // No links found, ask again
          addMessage(VALIDATION_MESSAGES.inspirationLinks, MessageSender.BOT);
          setUserResponses(updatedResponses);
          return;
        }
      }
    } else if (currentQuestion.phase === 'NewWebsiteCompetitors') {
      // Check if user selected "I don't have any"
      if (isIDontHaveAny(response)) {
        updatedResponses.competitors = '';
        updatedResponses.hasCompetitors = false;
      } else {
        // Check for URLs
        if (hasUrls(response)) {
          updatedResponses.competitors = response;
          updatedResponses.hasCompetitors = true;
        } else {
          // No links found, ask again
          addMessage(VALIDATION_MESSAGES.competitors, MessageSender.BOT);
          setUserResponses(updatedResponses);
          return;
        }
      }
    }

    setUserResponses(updatedResponses);

    // Move to next question
    moveToNextQuestion();
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
        // Validate URL if provided
        if (!hasUrls(response)) {
          addMessage("I didn't detect a valid webpage URL. Please paste the full URL (e.g., https://example.com), or leave it blank if you don't have one.", MessageSender.BOT);
          setUserResponses(updatedResponses);
          return;
        }
        updatedResponses.redesignCurrentUrl = response.trim();
      }
      // Continue to move to next question
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
    } else if (currentQuestion.phase === 'RedesignBrand') {
      updatedResponses.redesignHasBrand = isYesResponse(response);
      setUserResponses(updatedResponses);
      // Move to next question with updated responses to ensure correct skip logic
      moveToNextQuestion(updatedResponses);
      return;
    } else if (currentQuestion.phase === 'RedesignBrandDetails') {
      // User chose upload or text method
      if (response === 'Upload Files') {
        updatedResponses.redesignBrandDetailsMethod = 'upload';
        setUserResponses(updatedResponses);
        setShowFileUpload(true);
        addMessage("Please upload your brand guideline files (logo, color palette, fonts, etc.). You can drag and drop files or click to browse.", MessageSender.BOT);
        return; // Wait for file upload
      } else if (response === 'Describe in Text') {
        updatedResponses.redesignBrandDetailsMethod = 'text';
        // Move to redesignBrandDetailsText question
        setUserResponses(updatedResponses);
        const textQuestionIndex = REDESIGN_WEBSITE_QUESTION_ORDER.indexOf('redesignBrandDetailsText');
        if (textQuestionIndex !== -1) {
          const textQuestion = REDESIGN_WEBSITE_QUESTIONS['redesignBrandDetailsText'];
          if (textQuestion) {
            setCurrentQuestionIndex(textQuestionIndex);
            setCurrentPhase(getPhaseFromString(textQuestion.phase));
            addMessage(textQuestion.question, MessageSender.BOT);
          } else {
            console.error('redesignBrandDetailsText question not found');
            addMessage("I encountered an error. Please refresh the page and try again.", MessageSender.BOT);
          }
        } else {
          console.error('redesignBrandDetailsText question index not found');
          addMessage("I encountered an error. Please refresh the page and try again.", MessageSender.BOT);
        }
        return;
      }
    } else if (currentQuestion.phase === 'RedesignBrandDetails' && userResponses.redesignBrandDetailsMethod === 'text') {
      // This handles the text input for brand details (when phase is still RedesignBrandDetails but method is text)
      const validationError = validateNonEmpty(response, VALIDATION_MESSAGES.brandDetails);
      if (validationError) {
        addMessage(validationError, MessageSender.BOT);
        setUserResponses(updatedResponses);
        return;
      }
      updatedResponses.redesignBrandDetails = response.trim();
      // Continue to move to next question
    } else if (currentQuestion.phase === 'RedesignInspirationLinks') {
      // Check if user selected "I don't have any"
      if (isIDontHaveAny(response)) {
        updatedResponses.redesignInspirationLinks = '';
        updatedResponses.redesignHasInspiration = false;
      } else {
        // Check for URLs
        if (hasUrls(response)) {
          updatedResponses.redesignInspirationLinks = response;
          updatedResponses.redesignHasInspiration = true;
        } else {
          // No links found, ask again
          addMessage(VALIDATION_MESSAGES.inspirationLinks, MessageSender.BOT);
          setUserResponses(updatedResponses);
          return;
        }
      }
    } else if (currentQuestion.phase === 'RedesignCompetitors') {
      // Check if user selected "I don't have any"
      if (isIDontHaveAny(response)) {
        updatedResponses.redesignCompetitors = '';
        updatedResponses.redesignHasCompetitors = false;
      } else {
        // Check for URLs
        if (hasUrls(response)) {
          updatedResponses.redesignCompetitors = response;
          updatedResponses.redesignHasCompetitors = true;
        } else {
          // No links found, ask again
          addMessage(VALIDATION_MESSAGES.competitors, MessageSender.BOT);
          setUserResponses(updatedResponses);
          return;
        }
      }
    }

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
        console.error('First question not found in new website flow');
        addMessage("I encountered an error starting the flow. Please refresh the page and try again.", MessageSender.BOT);
        return;
      }
      setCurrentPhase(getPhaseFromString(firstQuestion.phase));
      addMessage(firstQuestion.question, MessageSender.BOT);
    }, 500);
  };

  const startRedesignFlow = () => {
    addMessage("Great! I'd be happy to help you with your webpage redesign. Let me ask you a few questions to understand your current webpage and what you're aiming for.", MessageSender.BOT);
    setTimeout(() => {
      setCurrentQuestionIndex(0);
      setCurrentFlow('redesign');
      const firstQuestion = REDESIGN_WEBSITE_QUESTIONS[REDESIGN_WEBSITE_QUESTION_ORDER[0]];
      if (!firstQuestion) {
        console.error('First question not found in redesign flow');
        addMessage("I encountered an error starting the flow. Please refresh the page and try again.", MessageSender.BOT);
        return;
      }
      setCurrentPhase(getPhaseFromString(firstQuestion.phase));
      addMessage(firstQuestion.question, MessageSender.BOT);
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
    if (isLoading || !text.trim()) return;
    
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
    
    // Add "I don't have any" option for inspiration links question
    if (currentQuestion.phase === 'NewWebsiteInspirationLinks' || currentQuestion.phase === 'RedesignInspirationLinks') {
      return ['I don\'t have any'];
    }
    
    // Add "I don't have any" option for competitors question
    if (currentQuestion.phase === 'NewWebsiteCompetitors' || currentQuestion.phase === 'RedesignCompetitors') {
      return ['I don\'t have any'];
    }
    
    return options;
  };

  const shouldShowQuickActions = () => {
    // Don't show quick actions when waiting for "Other" input
    if (userResponses.waitingForOtherInput) {
      return false;
    }
    
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return false;
    
    // Show quick actions for quick/yesno questions, and also for questions with "I don't have any" option
    if (currentQuestion.type === 'quick' || currentQuestion.type === 'yesno') {
      return true;
    }
    
    // Show quick actions for inspirationLinks question (has "I don't have any" option)
    if (currentQuestion.phase === 'NewWebsiteInspirationLinks' || currentQuestion.phase === 'RedesignInspirationLinks') {
      return true;
    }
    
    // Show quick actions for competitors question (has "I don't have any" option)
    if (currentQuestion.phase === 'NewWebsiteCompetitors' || currentQuestion.phase === 'RedesignCompetitors') {
      return true;
    }
    
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
    // Hide input bar in initial phase when quick actions are available
    if (currentPhase === WorkflowPhase.INITIAL) {
      return false; // Only quick action buttons are shown, no input needed
    }
    
    // Show input bar when waiting for "Other" input
    if (userResponses.waitingForOtherInput) {
      return true;
    }
    
    // Show input bar for text-type questions (free-form input required)
    const currentQuestion = getCurrentQuestion();
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
      console.error("Error handling file upload:", error);
      addMessage("There was an error processing your files. Please try again or choose 'Describe in Text' instead.", MessageSender.BOT);
    }
  };

  const captureWebpageScreenshotAndLog = async (url: string) => {
    try {
      const apiKey = getAndValidateApiKey();
      
      // Validate API key
      if (!apiKey) {
        console.error('Gemini API key is required for screenshot analysis');
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
      
      // Console log the binary result
      console.log('=== Webpage Screenshot Binary Data ===');
      console.log('URL:', url);
      console.log('Binary string:', binaryString);
      console.log('Binary string length:', binaryString.length, 'characters');
      console.log('Buffer size:', imageBuffer.byteLength, 'bytes');
      console.log('First 100 bytes:', Array.from(bytes.slice(0, 100)));
      console.log('=====================================');
      
      // Convert image to base64 for Gemini API
      const imageBase64 = arrayBufferToBase64(imageBuffer);
      
      // Send screenshot to Gemini AI for UI/UX audit
      const auditResponse = await analyzeScreenshotWithGemini(
        imageBase64,
        UI_UX_AUDIT_PROMPT,
        apiKey
      );
      
      // Console log the Gemini response
      console.log('=== Gemini UI/UX Audit Response ===');
      console.log(auditResponse);
      console.log('===================================');
      
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
        console.warn('No issues parsed from audit response. Response:', auditResponse);
        addMessage(
          'I\'ve completed the UI/UX audit of your webpage. The analysis didn\'t identify any critical issues, or the response format was unexpected.',
          MessageSender.BOT
        );
      }
    } catch (error: any) {
      console.error('Error capturing webpage screenshot or analyzing with Gemini:', error);
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
    const apiKey = getAndValidateApiKey();

    // Validate API key
    if (!apiKey) {
      addMessage(
        buildMissingApiKeyMessage('generate your redesigned webpage'),
        MessageSender.BOT
      );
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
      await generateRedesignHtml(apiKey);
    } catch (error: any) {
      console.error('Error in delayed generation process:', error);
      addMessage(buildUserFriendlyErrorMessage(error, 'generating your redesigned webpage'), MessageSender.BOT);
      resetGenerationState();
    }
  };

  const generateRedesignHtml = async (apiKey: string) => {
    try {
      // Build the redesign prompt from redesign-specific inputs
      const fullPrompt = buildRedesignPrompt(userResponses);

      // Generate HTML
      setGenerationProgressText('Connecting to AI...');
      const rawResponse = await generateHtmlWithGemini(fullPrompt, apiKey);

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
    } catch (error: any) {
      console.error('Error generating redesigned HTML:', error);
      addMessage(buildUserFriendlyErrorMessage(error, 'generating your redesigned webpage'), MessageSender.BOT);
    } finally {
      resetGenerationState();
    }
  };

  const generateHtml = async () => {
    const apiKey = getAndValidateApiKey();

    // Validate API key
    if (!apiKey) {
      addMessage(
        buildMissingApiKeyMessage('generate your webpage'),
        MessageSender.BOT
      );
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
      // Build the prompt
      const commonPrompt = buildCommonPrompt(userResponses);
      const pageTypePrompt = getPageTypePrompt(userResponses.pageType);
      const fullPrompt = buildFullPrompt(commonPrompt, pageTypePrompt);

      // Generate HTML
      setGenerationProgressText('Connecting to AI...');
      const rawResponse = await generateHtmlWithGemini(fullPrompt, apiKey);

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
    } catch (error: any) {
      console.error('Error generating HTML:', error);
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
    handleAuditContinue
  };
};

export default useChat;
