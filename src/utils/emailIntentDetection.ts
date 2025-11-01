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
  conversationHistory?: any[]
): IntentAnalysis {
  const prompt = userPrompt.toLowerCase().trim();
  
  // Strong update indicators
  const updateKeywords = [
    'update', 'modify', 'change', 'edit', 'fix', 'improve', 'adjust',
    'add to', 'remove from', 'replace', 'instead of', 'rather than',
    'make it', 'make the', 'change the', 'update the', 'fix the',
    'add a', 'remove the', 'replace the', 'instead make'
  ];
  
  // Strong create indicators  
  const createKeywords = [
    'create', 'generate', 'new', 'make', 'build', 'design', 'write',
    'start fresh', 'from scratch', 'different email', 'another email'
  ];
  
  // Context references (suggest update)
  const contextReferences = [
    'this email', 'the email', 'current email', 'above email',
    'that email', 'my email', 'the one', 'it', 'this one'
  ];
  
  // Specific change requests (strong update signals)
  const specificChanges = [
    'button', 'color', 'subject', 'headline', 'image', 'text',
    'font', 'size', 'layout', 'cta', 'link', 'section'
  ];
  
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
  let hasSpecificChange = false;
  specificChanges.forEach(change => {
    if (prompt.includes(`${change}`) && (
      prompt.includes(`change ${change}`) ||
      prompt.includes(`make ${change}`) ||
      prompt.includes(`update ${change}`) ||
      prompt.includes(`fix ${change}`)
    )) {
      updateScore += 4;
      hasSpecificChange = true;
      reasoning.push(`Requests specific change to: "${change}"`);
    }
  });
  
  // Boost update score if there's an existing email
  if (hasExistingEmail) {
    updateScore += 1;
    reasoning.push('Has existing email in context');
  } else {
    createScore += 1;
    reasoning.push('No existing email in context');
  }
  
  // Check conversation history for context
  if (conversationHistory && conversationHistory.length > 0) {
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    if (lastMessage?.type === 'email') {
      updateScore += 2;
      reasoning.push('Previous message was an email generation');
    }
  }
  
  // Pattern analysis
  const isQuestion = prompt.includes('?');
  const hasComparison = prompt.includes('instead') || prompt.includes('rather') || prompt.includes('vs');
  const hasNegation = prompt.includes("don't") || prompt.includes("not") || prompt.includes("remove");
  
  if (hasComparison || hasNegation) {
    updateScore += 2;
    reasoning.push('Contains comparison or negation language');
  }
  
  // Determine intent
  let intent: 'create' | 'update' | 'unclear';
  let confidence: number;
  
  const totalScore = updateScore + createScore;
  const updateConfidence = totalScore > 0 ? updateScore / totalScore : 0;
  const createConfidence = totalScore > 0 ? createScore / totalScore : 0;
  
  if (updateScore > createScore && updateScore >= 3) {
    intent = 'update';
    confidence = Math.min(updateConfidence, 0.95);
  } else if (createScore > updateScore && createScore >= 3) {
    intent = 'create';
    confidence = Math.min(createConfidence, 0.95);
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
