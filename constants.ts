
import { Message, MessageSender } from './types';

export const WELCOME_MESSAGE_1: Message = {
  id: 'initial-welcome-1',
  text: "Hello! Welcome to the Design UI/UX Chatbot. I'm here to help you with your design needs.",
  sender: MessageSender.BOT,
};

export const WELCOME_MESSAGE_2: Message = {
  id: 'initial-welcome-2',
  text: "What are you looking for today?",
  sender: MessageSender.BOT,
};

export const QUICK_ACTIONS = [
  "Webpage Redesign",
  "New Webpage from Scratch",
];

// Shared question content used across multiple flows
export const SHARED_ROLE_OPTIONS = ['Business Owner', 'Marketing', 'Developer', 'Other'];

export const SHARED_BUSINESS_QUESTION = "In one or two lines, what does your business or project do?";
export const SHARED_BUSINESS_PLACEHOLDER = 'Tell me about your business...';

export const SHARED_AUDIENCE_QUESTION = "Tell us about your main target audiences — like their gender, where they're located, and their age group";
export const SHARED_AUDIENCE_PLACEHOLDER = 'Describe your target audience...';

// New Website from Scratch - Question Configuration
export interface QuestionConfig {
  phase: string;
  question: string;
  type: 'quick' | 'text' | 'yesno';
  options?: string[];
  placeholder?: string;
  followUpPhase?: string;
}

export const NEW_WEBSITE_QUESTIONS: Record<string, QuestionConfig> = {
  // role: {
  //   phase: 'NewWebsiteRole',
  //   question: "Let's start! What's your role?",
  //   type: 'quick',
  //   options: SHARED_ROLE_OPTIONS,
  // },
  business: {
    phase: 'NewWebsiteBusiness',
    question: `Great! ${SHARED_BUSINESS_QUESTION}`,
    type: 'text',
    placeholder: SHARED_BUSINESS_PLACEHOLDER,
  },
  audience: {
    phase: 'NewWebsiteAudience',
    question: SHARED_AUDIENCE_QUESTION,
    type: 'text',
    placeholder: SHARED_AUDIENCE_PLACEHOLDER,
  },
  goals: {
    phase: 'NewWebsiteGoals',
    question: "What are the top 3 goals for your new webpage?",
    type: 'text',
    placeholder: 'e.g., Generate leads, Showcase products, Build brand awareness...',
  },
  pageType: {
    phase: 'NewWebsitePageType',
    question: "Which page do you want to create? (Landing page, Contact page, etc.)",
    type: 'quick',
    options: [
      'Home Page',
      'Landing Page',
      'Product Page',
      'Service Page',
      'Portfolio Page',
      'Other',
    ],
  },
  brand: {
    phase: 'NewWebsiteBrand',
    question: "Do you have any existing design rules regarding colors, fonts, or styling?",
    type: 'text',
    placeholder: 'Enter color code (e.g., #FF5733), font name (e.g., Roboto), or styling notes...',
    options: ["I don't have any"],
  },
  // inspirationLinks: {
  //   phase: 'NewWebsiteInspirationLinks',
  //   question: "Do you have any reference webpage in mind whose design you like? If yes, please share the links and briefly explain which design aspects you liked (e.g., layout, typography, color palette, interactions).",
  //   type: 'text',
  //   placeholder: 'Paste webpage URLs here (e.g., https://example.com)...',
  // },
  // competitors: {
  //   phase: 'NewWebsiteCompetitors',
  //   question: "Do you have any competitor webpages in mind whose design you want us to review? If yes, please share the links and note the design aspects you want us to focus on (e.g., navigation, visuals, CTAs).",
  //   type: 'text',
  //   placeholder: 'Paste competitor webpage URLs here (e.g., https://example.com)...',
  // },
  referencesAndCompetitors: {
    phase: 'NewWebsiteReferencesAndCompetitors',
    question: "Could you share links to your top 3 reference or competitor websites, briefly explaining which design elements you would like us to review (e.g., layout, navigation, typography)?",
    type: 'text',
    placeholder: 'Paste webpage URLs here (e.g., https://example.com)...',
  },
};

// Question flow order - New Website from Scratch
export const NEW_WEBSITE_QUESTION_ORDER = [
  // 'role', // Temporarily removed - may be reintroduced later
  'business',
  'audience',
  'goals',
  'pageType',
  'brand',
  'referencesAndCompetitors',
];

// Website Redesign - Question Configuration
export const REDESIGN_WEBSITE_QUESTIONS: Record<string, QuestionConfig> = {
  // redesignRole: {
  //   phase: 'RedesignRole',
  //   question: "Let's start! What's your role?",
  //   type: 'quick',
  //   options: SHARED_ROLE_OPTIONS,
  // },
  currentUrl: {
    phase: 'RedesignCurrentUrl',
    question: "What is your current webpage URL (if you have one)?",
    type: 'text',
    placeholder: 'Paste your webpage URL here...',
  },
  reuseContent: {
    phase: 'RedesignReuseContent',
    question: "Would you like to reuse the existing content from your webpage?",
    type: 'yesno',
    options: ['Yes', 'No'],
  },
  // redesignType: {
  //   phase: 'RedesignType',
  //   question: "Do you need a completely new design or a redesign of your existing website?",
  //   type: 'quick',
  //   options: [
  //     'Completely new design',
  //     'Redesign based on existing layout',
  //     'Not sure yet',
  //   ],
  // },
  redesignAudience: {
    phase: 'RedesignAudience',
    question: SHARED_AUDIENCE_QUESTION,
    type: 'text',
    placeholder: SHARED_AUDIENCE_PLACEHOLDER,
  },
  issues: {
    phase: 'RedesignIssues',
    question: "From your perspective, which of these best describes what is not working with your current webpage? You can select multiple options and then tap \"Done selecting issues\" when you're finished.",
    type: 'quick',
    options: [
      'It isn\'t generating enough leads or sales',
      'The design is outdated or doesn\'t fit our brand',
      'It provides a poor experience on mobile devices',
      'The site feels slow, clunky, or unresponsive',
      'It is too difficult for us to update content',
      'Other',
      'Done selecting issues',
    ],
  },
  // redesignBrand: {
  //   phase: 'RedesignBrand',
  //   question: "Do you have existing brand guidelines? (logo, colors, fonts, imagery style)",
  //   type: 'yesno',
  //   options: ['Yes', 'No'],
  //   followUpPhase: 'RedesignBrandDetails',
  // },
  // redesignBrandDetails: {
  //   phase: 'RedesignBrandDetails',
  //   question: "Great! You can either upload your brand guideline files or share the details in text. Would you like to upload files or describe them?",
  //   type: 'quick',
  //   options: ['Upload Files', 'Describe in Text'],
  // },
  // redesignBrandDetailsText: {
  //   phase: 'RedesignBrandDetails',
  //   question: "Please share details about your brand guidelines (colors, fonts, logo, imagery style, etc.)",
  //   type: 'text',
  //   placeholder: 'e.g., Primary color: #FF5733, Font: Arial, Logo description, Style notes...',
  // },
  // redesignInspirationLinks: {
  //   phase: 'RedesignInspirationLinks',
  //   question: "Do you have any reference webpage in mind whose design you like? If yes, please share the links and briefly explain which design aspects you liked (e.g., layout, typography, color palette, interactions).",
  //   type: 'text',
  //   placeholder: 'Paste webpage URLs here (e.g., https://example.com)...',
  // },
  // redesignCompetitors: {
  //   phase: 'RedesignCompetitors',
  //   question: "Do you have any competitor webpages in mind whose design you want us to review? If yes, please share the links and note the design aspects you want us to focus on (e.g., navigation, visuals, CTAs).",
  //   type: 'text',
  //   placeholder: 'Paste competitor webpage URLs here (e.g., https://example.com)...',
  // },
  redesignReferencesAndCompetitors: {
    phase: 'RedesignReferencesAndCompetitors',
    question: "Could you share links to your top 3 reference or competitor websites, briefly explaining which design elements you would like us to review (e.g., layout, navigation, typography)?",
    type: 'text',
    placeholder: 'Paste webpage URLs here (e.g., https://example.com)...',
  },
};

// Question flow order - Website Redesign
export const REDESIGN_WEBSITE_QUESTION_ORDER = [
  // 'redesignRole', // Temporarily removed - may be reintroduced later
  'currentUrl',
  'reuseContent',
  // 'redesignType', // Removed - no longer required
  'redesignAudience',
  'issues',
  // 'redesignBrand', // Removed - brand guidelines question removed from redesign flow
  // 'redesignBrandDetails', // Removed - brand guidelines question removed from redesign flow
  // 'redesignBrandDetailsText', // Removed - brand guidelines question removed from redesign flow
  'redesignReferencesAndCompetitors',
];
