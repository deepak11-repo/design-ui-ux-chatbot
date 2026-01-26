// File: ./utils/questionHelpers.ts

import { WorkflowPhase } from '../types';
import { UserResponses } from '../types';

/**
 * Converts phase string to WorkflowPhase enum
 */
export const getPhaseFromString = (phaseString: string): WorkflowPhase => {
  const phaseMap: Record<string, WorkflowPhase> = {
    // New Website from Scratch
    'NewWebsiteBusiness': WorkflowPhase.NEW_WEBSITE_BUSINESS,
    'NewWebsiteAudience': WorkflowPhase.NEW_WEBSITE_AUDIENCE,
    'NewWebsiteGoals': WorkflowPhase.NEW_WEBSITE_GOALS,
    'NewWebsitePageType': WorkflowPhase.NEW_WEBSITE_PAGE_TYPE,
    'NewWebsiteBrand': WorkflowPhase.NEW_WEBSITE_BRAND,
    'NewWebsiteBrandDetails': WorkflowPhase.NEW_WEBSITE_BRAND_DETAILS,
    'NewWebsiteInspirationLinks': WorkflowPhase.NEW_WEBSITE_INSPIRATION_LINKS,
    'NewWebsiteCompetitors': WorkflowPhase.NEW_WEBSITE_COMPETITORS,
    'NewWebsiteReferencesAndCompetitors': WorkflowPhase.NEW_WEBSITE_REFERENCES_AND_COMPETITORS,
    // Website Redesign
    'RedesignCurrentUrl': WorkflowPhase.REDESIGN_CURRENT_URL,
    'RedesignReuseContent': WorkflowPhase.REDESIGN_REUSE_CONTENT,
    'RedesignAudience': WorkflowPhase.REDESIGN_AUDIENCE,
    'RedesignIssues': WorkflowPhase.REDESIGN_ISSUES,
    'RedesignBrand': WorkflowPhase.REDESIGN_BRAND,
    'RedesignBrandDetails': WorkflowPhase.REDESIGN_BRAND_DETAILS,
    'RedesignInspirationLinks': WorkflowPhase.REDESIGN_INSPIRATION_LINKS,
    'RedesignCompetitors': WorkflowPhase.REDESIGN_COMPETITORS,
    'RedesignReferencesAndCompetitors': WorkflowPhase.REDESIGN_REFERENCES_AND_COMPETITORS,
  };
  return phaseMap[phaseString] || WorkflowPhase.INITIAL;
};

/**
 * Checks if current phase is a NEW_WEBSITE phase
 */
export const isNewWebsitePhase = (phase: WorkflowPhase): boolean => {
  return [
    WorkflowPhase.NEW_WEBSITE_BUSINESS,
    WorkflowPhase.NEW_WEBSITE_AUDIENCE,
    WorkflowPhase.NEW_WEBSITE_GOALS,
    WorkflowPhase.NEW_WEBSITE_PAGE_TYPE,
    WorkflowPhase.NEW_WEBSITE_BRAND,
    WorkflowPhase.NEW_WEBSITE_BRAND_DETAILS,
    WorkflowPhase.NEW_WEBSITE_INSPIRATION_LINKS,
    WorkflowPhase.NEW_WEBSITE_COMPETITORS,
    WorkflowPhase.NEW_WEBSITE_REFERENCES_AND_COMPETITORS,
  ].includes(phase);
};

/**
 * Checks if current phase is a Website Redesign phase
 */
export const isRedesignPhase = (phase: WorkflowPhase): boolean => {
  return [
    WorkflowPhase.REDESIGN_CURRENT_URL,
    WorkflowPhase.REDESIGN_REUSE_CONTENT,
    WorkflowPhase.REDESIGN_AUDIENCE,
    WorkflowPhase.REDESIGN_ISSUES,
    WorkflowPhase.REDESIGN_BRAND,
    WorkflowPhase.REDESIGN_BRAND_DETAILS,
    WorkflowPhase.REDESIGN_INSPIRATION_LINKS,
    WorkflowPhase.REDESIGN_COMPETITORS,
    WorkflowPhase.REDESIGN_REFERENCES_AND_COMPETITORS,
  ].includes(phase);
};

/**
 * Determines the next question index, skipping questions based on user responses
 */
export const getNextQuestionIndex = (
  currentIndex: number,
  questionOrder: string[],
  responses: UserResponses
): number => {
  let nextIndex = currentIndex + 1;
  
  while (nextIndex < questionOrder.length) {
    const nextQuestionKey = questionOrder[nextIndex];
    
    break;
  }
  
  return nextIndex;
};

/**
 * Determines the next question index for Website Redesign flow
 * Handles conditional skips for brand questions
 */
export const getNextRedesignQuestionIndex = (
  currentIndex: number,
  questionOrder: string[],
  responses: UserResponses
): number => {
  let nextIndex = currentIndex + 1;
  
  // Brand questions removed from redesign flow - no skip logic needed
  
  if (nextIndex >= questionOrder.length) {
    return questionOrder.length;
  }
  
  return nextIndex;
};

/**
 * Checks if response is "Other" option
 */
export const isOtherOption = (response: string): boolean => {
  return response === 'Other' || response.toLowerCase().trim() === 'other';
};

/**
 * Checks if response is a Yes/No answer
 */
export const isYesResponse = (response: string): boolean => {
  return response.toLowerCase().trim() === 'yes';
};

/**
 * Checks if response is a Skip action
 */
export const isSkipAction = (response: string): boolean => {
  return response.toLowerCase().trim() === 'skip' || response === 'Skip';
};

