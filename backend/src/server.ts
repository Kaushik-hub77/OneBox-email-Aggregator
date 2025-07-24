import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors from 'cors';
import emailsRouter from './routes/emails';
import aiRouter from './routes/ai';
import { ImapService } from './services/imapService';
import { AIService } from './services/aiService';
import { ElasticsearchService } from './services/elasticsearchService';
import { Email, EmailCategory, EmailAccount } from './types';
import { emailAccounts } from './config/emailAccounts';
// import { logger } from './utils/logger';

// Simple logger fallback
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
};

// Initialize services
const imapService = new ImapService();
const aiService = new AIService();
const esService = new ElasticsearchService();

// Use imported emailAccounts instead of hardcoded array
// const emailAccounts: EmailAccount[] = [
//   // {
//   //   id: 'account1',
//   //   host: 'imap.example.com',
//   //   port: 993,
//   //   user: 'user@example.com',
//   //   password: 'password',
//   //   tls: true,
//   //   label: 'Example Account'
//   // },
//   // Add more accounts as needed
// ];

async function main() {
  // Express app setup
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Mount routers
  app.use('/emails', emailsRouter);
  app.use('/ai', aiRouter);

  // Health check
  app.get('/', (req, res) => res.send('Email Onebox Backend Running'));

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });

  // Connect to all IMAP accounts
  for (const account of emailAccounts) {
    try {
      await imapService.connectAccount(account);
    } catch (err) {
      logger.error(`Failed to connect IMAP for ${account.user}:`, err);
    }
  }

  // Listen for new emails
  imapService.on('newEmail', async (email: Email) => {
    logger.info(`Received new email: ${email.subject}`);
    try {
      // 1. Categorize email
      const { category, score } = await aiService.categorizeEmail(email);
      email.category = category;
      email.aiScore = score;

      // 2. Index email in Elasticsearch
      await esService.indexEmail(email);
    } catch (err) {
      logger.error('Error processing new email:', err);
    }
  });
}

main();

