import { ImapFlow, ImapFlowOptions, MessageEnvelope, FetchMessageObject } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { EmailAccount, Email, EmailAttachment } from '../types';
import { EventEmitter } from 'events';

const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
};

export class ImapService extends EventEmitter {
  private clients: Map<string, ImapFlow> = new Map();

  /**
   * Connects to all provided IMAP accounts using ImapFlow.
   * Fetches last 30 days of emails and sets up real-time listeners.
   */
  async connectAccounts(accounts: EmailAccount[]): Promise<void> {
    for (const account of accounts) {
      await this.connectAccount(account);
    }
  }

  /**
   * Connects to a single IMAP account, fetches last 30 days of emails, and sets up real-time updates.
   */
  async connectAccount(account: EmailAccount): Promise<void> {
    const options: ImapFlowOptions = {
      host: account.host,
      port: account.port,
      secure: account.tls,
      auth: {
        user: account.user,
        pass: account.password,
      },
      logger: false,
    };
    const client = new ImapFlow(options);
    this.clients.set(account.id, client);

    client.on('error', (err) => {
      logger.error(`IMAP error for ${account.user}:`, err);
    });

    client.on('close', () => {
      logger.warn(`IMAP connection closed for ${account.user}`);
    });

    await client.connect();
    logger.info(`IMAP connected for account: ${account.user}`);
    await client.mailboxOpen('INBOX');

    // Fetch last 30 days of emails
    await this.fetchRecentEmails(account, client);

    // Listen for new mail in real time
    client.on('exists', async (mailbox) => {
      logger.info(`New mail detected for ${account.user}`);
      await this.fetchNewEmails(account, client);
    });
  }

  /**
   * Fetches emails from the last 30 days from the INBOX.
   */
  private async fetchRecentEmails(account: EmailAccount, client: ImapFlow): Promise<void> {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = since.getDate();
    const month = months[since.getMonth()];
    const year = since.getFullYear();
    const sinceStr = `${day}-${month}-${year}`; // e.g., '24-Jun-2025'

    // 1. Search for UIDs since the date
    const uids = await client.search({ since: sinceStr });

    // 2. Fetch those messages
    for await (const msg of client.fetch(uids, { envelope: true, source: true, uid: true })) {
      await this.processMessage(account, msg);
    }
  }

  /**
   * Fetches unseen (new) emails from the INBOX.
   */
  private async fetchNewEmails(account: EmailAccount, client: ImapFlow): Promise<void> {
    for await (const msg of client.fetch({ seen: false }, { envelope: true, source: true, uid: true })) {
      await this.processMessage(account, msg);
    }
  }

  /**
   * Processes a fetched message, parses it, and emits a 'newEmail' event.
   */
  private async processMessage(account: EmailAccount, msg: FetchMessageObject): Promise<void> {
    try {
      const parsed: ParsedMail = await simpleParser(msg.source);
      const attachments: EmailAttachment[] = (parsed.attachments || []).map(att => ({
        filename: att.filename || 'unknown',
        contentType: att.contentType,
        size: att.size,
        cid: att.cid
      }));
      const getAddressList = (addr) => {
        if (!addr) return [];
        if (Array.isArray(addr)) return addr.map(a => a.address || a.text || '');
        if (typeof addr === 'object') return [addr.address || addr.text || ''];
        return [];
      };
      const email: Email = {
        id: `${account.id}_${msg.uid}`,
        messageId: parsed.messageId || `${account.id}_${msg.uid}_${Date.now()}`,
        accountId: account.id,
        folder: 'INBOX',
        subject: parsed.subject || '',
        from: getAddressList(parsed.from).join(', '),
        to: getAddressList(parsed.to),
        cc: getAddressList(parsed.cc),
        bcc: getAddressList(parsed.bcc),
        date: parsed.date || new Date(),
        bodyText: parsed.text || '',
        bodyHtml: parsed.html || '',
        attachments,
        flags: [],
        indexedAt: new Date(),
        uid: msg.uid
      };
      this.emit('newEmail', email);
      logger.info('Indexing email:', email.subject, email.accountId, email.date);
    } catch (error) {
      logger.error('Error processing message:', error);
    }
  }

  /**
   * Disconnects all IMAP clients.
   */
  async disconnectAll(): Promise<void> {
    for (const client of this.clients.values()) {
      await client.logout();
    }
    this.clients.clear();
  }
}