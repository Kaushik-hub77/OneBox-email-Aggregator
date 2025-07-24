import axios from 'axios';
import { Email, EmailCategory } from '../types';
// Simple logger fallback
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
};

export class NotificationService {
  private slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  private externalWebhookUrl = process.env.EXTERNAL_WEBHOOK_URL;

  async sendSlackNotification(email: Email): Promise<void> {
    if (!this.slackWebhookUrl) {
      logger.warn('Slack webhook URL not configured');
      return;
    }

    try {
      const message = {
        text: `🎯 New Interested Email Received!`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'New Interested Email!'
            }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Subject:* ${email.subject}` },
              { type: 'mrkdwn', text: `*From:* ${email.from}` },
              { type: 'mrkdwn', text: `*To:* ${email.to.join(', ')}` },
              { type: 'mrkdwn', text: `*Date:* ${email.date}` }
            ]
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*Body:*
${email.bodyText.substring(0, 200)}...` }
          }
        ]
      };
      await axios.post(this.slackWebhookUrl, message);
      logger.info('Sent Slack notification for Interested email');
    } catch (error) {
      logger.error('Error sending Slack notification:', error);
    }
  }

  async sendWebhookNotification(email: Email): Promise<void> {
    if (!this.externalWebhookUrl) {
      logger.warn('External webhook URL not configured');
      return;
    }
    try {
      await axios.post(this.externalWebhookUrl, email);
      logger.info('Triggered external webhook for Interested email');
    } catch (error) {
      logger.error('Error triggering external webhook:', error);
    }
  }
}