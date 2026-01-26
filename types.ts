
export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
}

export interface Message {
  id: string;
  text: string;
  sender: MessageSender;
  htmlContent?: string; // For messages containing generated HTML
  isHtmlMessage?: boolean; // Flag to identify HTML preview messages
  auditIssues?: string[]; // For messages containing UI/UX audit issues
  isAuditMessage?: boolean; // Flag to identify audit result messages
  isRatingPrompt?: boolean; // Flag to show rating UI
  isFeedbackPrompt?: boolean; // Flag to show feedback input UI
  isEmailPrompt?: boolean; // Flag to show email input UI
  isReferencesAndCompetitorsPrompt?: boolean; // Flag to show references/competitors multi-entry UI
}

export enum WorkflowPhase {
  INITIAL = 'Initial',
  USER_CHOICE = 'UserChoice',
  // New Website from Scratch flow
  NEW_WEBSITE_ROLE = 'NewWebsiteRole',
  NEW_WEBSITE_BUSINESS = 'NewWebsiteBusiness',
  NEW_WEBSITE_AUDIENCE = 'NewWebsiteAudience',
  NEW_WEBSITE_GOALS = 'NewWebsiteGoals',
  NEW_WEBSITE_PAGE_TYPE = 'NewWebsitePageType',
  NEW_WEBSITE_BRAND = 'NewWebsiteBrand',
  NEW_WEBSITE_BRAND_DETAILS = 'NewWebsiteBrandDetails',
  NEW_WEBSITE_HAS_INSPIRATION = 'NewWebsiteHasInspiration',
  NEW_WEBSITE_INSPIRATION_LINKS = 'NewWebsiteInspirationLinks',
  NEW_WEBSITE_HAS_COMPETITORS = 'NewWebsiteHasCompetitors',
  NEW_WEBSITE_COMPETITORS = 'NewWebsiteCompetitors',
  NEW_WEBSITE_REFERENCES_AND_COMPETITORS = 'NewWebsiteReferencesAndCompetitors',
  NEW_WEBSITE_COMPLETE = 'NewWebsiteComplete',
  // Website Redesign flow
  REDESIGN_ROLE = 'RedesignRole',
  REDESIGN_CURRENT_URL = 'RedesignCurrentUrl',
  REDESIGN_REUSE_CONTENT = 'RedesignReuseContent',
  REDESIGN_TYPE = 'RedesignType',
  REDESIGN_BUSINESS = 'RedesignBusiness',
  REDESIGN_AUDIENCE = 'RedesignAudience',
  REDESIGN_WHY_NOW = 'RedesignWhyNow',
  REDESIGN_ISSUES = 'RedesignIssues',
  REDESIGN_GOALS = 'RedesignGoals',
  REDESIGN_BRAND = 'RedesignBrand',
  REDESIGN_BRAND_DETAILS = 'RedesignBrandDetails',
  REDESIGN_INSPIRATION_LINKS = 'RedesignInspirationLinks',
  REDESIGN_COMPETITORS = 'RedesignCompetitors',
  REDESIGN_REFERENCES_AND_COMPETITORS = 'RedesignReferencesAndCompetitors',
  REDESIGN_COMPLETE = 'RedesignComplete',
}

export interface UserResponses {
  // New Website from Scratch responses
  business?: string;
  audience?: string;
  goals?: string;
  pageType?: string;
  hasBrand?: boolean;
  brandDetailsMethod?: 'upload' | 'text';
  brandDetails?: string;
  brandFiles?: File[];
  hasInspiration?: boolean;
  inspirationLinks?: string;
  hasCompetitors?: boolean;
  competitors?: string;
  referencesAndCompetitors?: string; // Combined field for references and competitors
  referenceWebsiteAnalysis?: Array<{
    url: string;
    description: string;
    analysis: any; // Validated JSON response from Gemini
  }>; // Analysis results for reference websites (stored silently, not displayed)
  waitingForOtherInput?: 'pageType' | 'redesignIssues'; // Track which field is waiting for "Other" input

  // Website Redesign responses
  redesignCurrentUrl?: string;
  redesignReuseContent?: boolean;
  redesignExtractedText?: string; // Extracted text content when reuse content is true
  redesignBusiness?: string;
  redesignAudience?: string;
  redesignIssues?: string;
  redesignHasBrand?: boolean;
  redesignBrandDetailsMethod?: 'upload' | 'text';
  redesignBrandDetails?: string;
  redesignBrandFiles?: File[];
  redesignHasInspiration?: boolean;
  redesignInspirationLinks?: string;
  redesignHasCompetitors?: boolean;
  redesignCompetitors?: string;
  redesignReferencesAndCompetitors?: string; // Combined field for references and competitors
  redesignReferenceWebsiteAnalysis?: Array<{
    url: string;
    description: string;
    analysis: any; // Validated JSON response from Gemini
  }>; // Analysis results for reference websites (stored silently, not displayed)
}
