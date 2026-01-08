import type { Clarifications } from '@/types';
import { retryWithBackoff } from './errors';
import { llm } from './llm';

const INITIAL_QUESTION_PROMPT = `You are a friendly product manager helping clarify a feature request. Your goal is to ask SHORT, SIMPLE questions that anyone can answer - whether they're technical or not.

Feature Title/Idea: {idea}
Problem Statement/Context: {context}
Constraints: {constraints}

Start the conversation by asking the FIRST and MOST IMPORTANT question. Keep it:
- SHORT (one sentence, max 15 words)
- SIMPLE (avoid technical jargon)
- CLEAR (easy for anyone to understand)

Examples of good questions:
- "Who will use this feature?"
- "What problem does this solve?"
- "When do you need this ready?"

Ask ONLY ONE short question. Be friendly and conversational.`;

const AI_RESPONSE_PROMPT = `You are a friendly product manager conducting a clarification session. Your goal is to ask SHORT, SIMPLE questions that anyone can answer.

Original Feature: {idea}
Context: {context}
Constraints: {constraints}
Repo URL: {repoUrl}

Question Count: {questionCount}

Conversation History:
{conversation}

The user just responded. Based on their answer:

**CRITICAL: If questionCount >= 5, you MUST NOT ask any more questions. You MUST only thank them and say you have enough information to proceed.**

Otherwise:
1. Acknowledge briefly (one short sentence)
2. Ask ONE short, simple question (max 15 words) about a NEW topic not already covered

**Critical guidelines:**
- Keep questions SHORT (one sentence, max 15 words)
- Use SIMPLE language (avoid technical terms)
- Ask ONE question at a time
- Cover topics: who uses it, what does it do, when needed, success measure
- IMPORTANT: Review the conversation history - do NOT ask questions already answered
- If questionCount >= 5: ONLY respond with a thank you message, NO questions

Your response should be:
- If questionCount >= 5: Just a warm thank you message (e.g., "Thank you so much! I have all the information I need to proceed.")
- Otherwise: [Brief acknowledgment] + [One short question]

Keep total response under 3 sentences.`;

const FINALIZE_CLARIFICATIONS_PROMPT = `You are a senior product manager finalizing feature clarifications.

Original Feature: {idea}
Context: {context}
Constraints: {constraints}

Full Conversation:
{conversation}

Based on the entire conversation, extract and structure the clarifications in this exact JSON format:
{
  "questions": ["Question 1 that was asked", "Question 2 that was asked", ...],
  "assumptions": ["Assumption 1 based on answers", "Assumption 2 based on answers", ...],
  "scope": "Clear, comprehensive scope statement (2-3 sentences) based on the conversation"
}

The questions array should contain the key questions that were asked during the conversation.
The assumptions array should contain 3-5 key assumptions validated or identified during the conversation.
The scope should be a clear statement of what's in and out of scope based on the user's answers.

Return ONLY valid JSON, no markdown formatting.`;

export async function generateInitialQuestion(
  idea: string,
  context: string,
  constraints: string | null
): Promise<string> {
  const prompt = INITIAL_QUESTION_PROMPT.replace('{idea}', idea)
    .replace('{context}', context)
    .replace('{constraints}', constraints || 'None');

  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    return content.trim();
  } catch (error) {
    console.error('❌ [CLARIFIER] Error generating initial question:', error);
    // Fallback question - short and simple
    return 'Hi! Who will use this feature?';
  }
}

export async function generateAIResponse(
  session: {
    idea: string;
    context: string | null;
    constraints: string | null;
    repoUrl?: string | null;
    messages: Array<{ role: string; content: string }>;
  },
  userMessage: string,
  questionCount: number
): Promise<string> {
  // Build conversation history
  const conversationHistory = session.messages
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  const conversation = `${conversationHistory}\n\nUser: ${userMessage}`;

  const prompt = AI_RESPONSE_PROMPT.replace('{idea}', session.idea)
    .replace('{context}', session.context || 'Not specified')
    .replace('{constraints}', session.constraints || 'None')
    .replace('{repoUrl}', session.repoUrl || 'Not provided')
    .replace('{questionCount}', String(questionCount))
    .replace('{conversation}', conversation);

  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    return content.trim();
  } catch (error) {
    console.error('❌ [CLARIFIER] Error generating AI response:', error);
    return 'Thank you for that information. Let me continue with the next question.';
  }
}

export async function generateClarificationsFromChat(session: {
  idea: string;
  context: string | null;
  constraints: string | null;
  messages: Array<{ role: string; content: string }>;
}): Promise<Clarifications> {
  // Build full conversation
  const conversation = session.messages
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  const prompt = FINALIZE_CLARIFICATIONS_PROMPT.replace('{idea}', session.idea)
    .replace('{context}', session.context || 'Not specified')
    .replace('{constraints}', session.constraints || 'None')
    .replace('{conversation}', conversation);

  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;

    const clarifications = JSON.parse(jsonStr) as Clarifications;

    return {
      questions: clarifications.questions || [],
      assumptions: clarifications.assumptions || [],
      scope: clarifications.scope || 'Scope to be determined',
    };
  } catch (error) {
    console.error('❌ [CLARIFIER] Error generating clarifications:', error);
    // Fallback
    return {
      questions: [],
      assumptions: [],
      scope: session.context || 'Scope to be determined',
    };
  }
}
