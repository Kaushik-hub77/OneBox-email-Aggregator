import { Email, EmailCategory, SuggestedReply, ProductContext } from '../types';
// Use console as logger fallback
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
};
import * as fs from 'fs';
import * as path from 'path';

export class AIService {
  // Remove OpenAI and vector DB logic, keep only DeepSeek categorization

  /**
   * Categorize an email using DeepSeek v3 API.
   * Sends the email content to DeepSeek and parses the response for category and score.
   * @param email The email to categorize
   * @returns { category, score }
   */
  async categorizeEmail(email: Email): Promise<{ category: EmailCategory; score: number }> {
    try {
      const emailContent = `Subject: ${email.subject}\nFrom: ${email.from}\nBody: ${email.bodyText}`;
      // Prepare DeepSeek API request
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324',
        messages: [
          {
            role: 'system',
              content: `You are an AI email categorizer. Categorize emails into exactly one of these categories:\n- Interested: Shows interest in a product, service, or opportunity\n- Meeting Booked: Confirms or schedules a meeting\n- Not Interested: Explicitly declines or shows no interest\n- Spam: Promotional, unsolicited, or spam emails\n- Out of Office: Automated out-of-office replies\nRespond with only the category name and a confidence score (0-1) in this format: \"CATEGORY:SCORE\"`
          },
          {
            role: 'user',
            content: emailContent
          }
        ],
        })
      });
      if (!response.ok) throw new Error(`DeepSeek API error: ${response.status}`);
      const data: any = await response.json();
      const result = data.choices?.[0]?.message?.content?.trim() || '';
      const [categoryStr, scoreStr] = result.split(':');
      const category = this.mapToEmailCategory(categoryStr?.trim());
      const score = parseFloat(scoreStr?.trim()) || 0.5;
      logger.info(`DeepSeek categorized email \"${email.subject}\" as ${category} (score: ${score})`);
      return { category, score };
    } catch (error) {
      logger.error('Error categorizing email with DeepSeek:', error);
      return { category: EmailCategory.UNCATEGORIZED, score: 0 };
    }
  }

  private mapToEmailCategory(categoryStr: string): EmailCategory {
    const normalized = categoryStr?.toLowerCase() || '';
    if (normalized.includes('interested')) return EmailCategory.INTERESTED;
    if (normalized.includes('meeting')) return EmailCategory.MEETING_BOOKED;
    if (normalized.includes('not interested')) return EmailCategory.NOT_INTERESTED;
    if (normalized.includes('spam')) return EmailCategory.SPAM;
    if (normalized.includes('out of office')) return EmailCategory.OUT_OF_OFFICE;
    return EmailCategory.UNCATEGORIZED;
  }
}