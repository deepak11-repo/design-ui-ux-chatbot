// File: ./utils/questionNavigation.ts

import { WorkflowPhase } from '../types';
import { getPhaseFromString } from './questionHelpers';
import { logger } from './logger';

/**
 * Helper to get next question and handle navigation
 * Returns null if all questions are completed, otherwise returns question info
 */
export const getNextQuestionInfo = (
  nextIndex: number,
  questionOrder: string[],
  questions: Record<string, any>,
  flowType: 'newWebsite' | 'redesign'
): { questionKey: string; question: any; index: number } | null => {
  if (nextIndex >= questionOrder.length) {
    return null; // All questions completed
  }

  const nextQuestionKey = questionOrder[nextIndex];
  const nextQuestion = questions[nextQuestionKey];

  if (!nextQuestion) {
    logger.error(`${flowType === 'newWebsite' ? 'New website' : 'Redesign'} question not found for key: ${nextQuestionKey} at index ${nextIndex}`);
    return null;
  }

  return {
    questionKey: nextQuestionKey,
    question: nextQuestion,
    index: nextIndex,
  };
};

/**
 * Checks if a question phase is the references/competitors prompt
 */
export const isReferencesAndCompetitorsPhase = (phase: string): boolean => {
  return phase === 'NewWebsiteReferencesAndCompetitors' || phase === 'RedesignReferencesAndCompetitors';
};
