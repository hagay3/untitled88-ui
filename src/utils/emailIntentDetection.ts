/**
 * Smart email intent detection for optimal UX
 * Determines if user wants to create new email or update existing one
 */

export interface IntentAnalysis {
  intent: 'create' | 'update' | 'unclear';
  confidence: number; // 0-1 scale
  reasoning: string[];
  suggestedAction?: string;
}

export function analyzeEmailIntent(
  userPrompt: string, 
  hasExistingEmail: boolean,
  _conversationHistory?: any[]
): IntentAnalysis {
  const prompt = userPrompt.toLowerCase().trim();
  
  // Strong update indicators - ONLY these specific words trigger update
  const updateKeywords = [
    'update', 'modify', 'change', 'existing'
  ];
  
  // Strong create indicators  
  const createKeywords = [
    'create', 'generate', 'new', 'make', 'build', 'design', 'write',
    'start fresh', 'from scratch', 'different email', 'another email'
  ];
  
  // Context references (suggest update) - DISABLED for stricter control
  const contextReferences: string[] = [];
  
  // Specific change requests (strong update signals) - DISABLED for stricter control
  const specificChanges: string[] = [];
  
  let reasoning: string[] = [];
  let updateScore = 0;
  let createScore = 0;
  
  // Check for update indicators
  updateKeywords.forEach(keyword => {
    if (prompt.includes(keyword)) {
      updateScore += 2;
      reasoning.push(`Contains update keyword: "${keyword}"`);
    }
  });
  
  // Check for create indicators
  createKeywords.forEach(keyword => {
    if (prompt.includes(keyword)) {
      createScore += 2;
      reasoning.push(`Contains create keyword: "${keyword}"`);
    }
  });
  
  // Check for context references
  contextReferences.forEach(ref => {
    if (prompt.includes(ref)) {
      updateScore += 3;
      reasoning.push(`References existing content: "${ref}"`);
    }
  });
  
  // Check for specific changes
  specificChanges.forEach(change => {
    if (prompt.includes(`${change}`) && (
      prompt.includes(`change ${change}`) ||
      prompt.includes(`make ${change}`) ||
      prompt.includes(`update ${change}`) ||
      prompt.includes(`fix ${change}`)
    )) {
      updateScore += 4;
      reasoning.push(`Requests specific change to: "${change}"`);
    }
  });
  
  // Default to create unless explicit update keywords are used
  if (!hasExistingEmail) {
    createScore += 1;
    reasoning.push('No existing email in context - defaulting to create');
  }
  
  // Conversation history no longer affects intent - only explicit keywords matter
  
  // Pattern analysis - DISABLED for stricter control
  // Only explicit update keywords will trigger updates
  
  // Determine intent
  let intent: 'create' | 'update' | 'unclear';
  let confidence: number;
  
  const totalScore = updateScore + createScore;
  const updateConfidence = totalScore > 0 ? updateScore / totalScore : 0;
  const createConfidence = totalScore > 0 ? createScore / totalScore : 0;
  
  // Only trigger update if explicit update keywords are found AND score is high enough
  if (updateScore >= 2 && updateScore > createScore) {
    intent = 'update';
    confidence = Math.min(updateConfidence, 0.95);
  } else if (createScore > 0 || updateScore === 0) {
    // Default to create for all other cases
    intent = 'create';
    confidence = Math.min(Math.max(createConfidence, 0.8), 0.95);
  } else {
    intent = 'unclear';
    confidence = 0.5;
  }
  
  // Special cases
  if (!hasExistingEmail && updateScore > 0) {
    intent = 'create';
    confidence = 0.8;
    reasoning.push('No existing email available for updates');
  }
  
  // Generate suggested action
  let suggestedAction: string | undefined;
  if (intent === 'unclear') {
    if (hasExistingEmail) {
      suggestedAction = 'Would you like me to update your current email or create a new one?';
    } else {
      suggestedAction = 'I\'ll create a new email for you based on your request.';
    }
  }
  
  return {
    intent,
    confidence,
    reasoning,
    suggestedAction
  };
}

/**
 * Generate a clarifying question when intent is unclear
 */
export function generateClarificationPrompt(
  userPrompt: string,
  hasExistingEmail: boolean
): string {
  if (!hasExistingEmail) {
    return "I'll create a new email for you based on your request.";
  }
  
  const prompt = userPrompt.toLowerCase();
  
  if (prompt.includes('button') || prompt.includes('color') || prompt.includes('text')) {
    return "Would you like me to update your current email with these changes, or create a completely new email?";
  }
  
  if (prompt.includes('different') || prompt.includes('another')) {
    return "I'll create a new email for you with these specifications.";
  }
  
  return "I can either update your current email or create a new one. Which would you prefer?";
}

/**
 * Examples for testing
 */
export const EXAMPLE_PROMPTS = {
  UPDATE: [
    "Change the button color to red",
    "Make the headline bigger", 
    "Update this email with a discount section",
    "Fix the mobile layout",
    "Add a footer to the email",
    "Replace the image with something more modern",
    "Make it more professional"
  ],
  CREATE: [
    "Create a welcome email for new users",
    "Generate a promotional email for Black Friday", 
    "Make a new newsletter about our product launch",
    "Design a different email for our webinar",
    "Build an email from scratch for our sale",
    "Write a new email about our services"
  ],
  UNCLEAR: [
    "Make it better",
    "I need something for marketing",
    "Can you help with email design?",
    "What do you think about this?",
    "I want to improve engagement"
  ]
};
