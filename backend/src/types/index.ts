export interface EmailAccount {
    id: string;
    host: string;
    port: number;
    user: string;
    password: string;
    tls: boolean;
    label: string;
  }
  
  export interface Email {
    id: string;
    messageId: string;
    accountId: string;
    folder: string;
    subject: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    date: Date;
    bodyText: string;
    bodyHtml: string;
    attachments: EmailAttachment[];
    flags: string[];
    category?: EmailCategory;
    aiScore?: number;
    indexedAt: Date;
    uid: number;
  }
  
  export interface EmailAttachment {
    filename: string;
    contentType: string;
    size: number;
    cid?: string;
  }
  
  export enum EmailCategory {
    INTERESTED = 'Interested',
    MEETING_BOOKED = 'Meeting Booked',
    NOT_INTERESTED = 'Not Interested',
    SPAM = 'Spam',
    OUT_OF_OFFICE = 'Out of Office',
    UNCATEGORIZED = 'Uncategorized'
  }
  
  export interface SearchQuery {
    query?: string;
    accountId?: string;
    folder?: string;
    category?: EmailCategory;
    from?: Date;
    to?: Date;
    page?: number;
    size?: number;
  }
  
  export interface SuggestedReply {
    reply: string;
    confidence: number;
    reasoning: string;
  }
  
  export interface ProductContext {
    id: string;
    content: string;
    type: 'product_info' | 'outreach_template' | 'meeting_info';
    embedding?: number[];
  }
  