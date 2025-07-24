import { ElasticsearchClient } from '../config/database';
import { Email, SearchQuery } from '../types';
// Use console as logger fallback
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
};

export class ElasticsearchService {
  private es = ElasticsearchClient.getInstance();
  private indexName = process.env.ELASTICSEARCH_INDEX || 'emails';

  async indexEmail(email: Email): Promise<boolean> {
    console.log('indexEmail CALLED', email && email.subject);
    try {
      logger.info('Indexing to index:', this.indexName);
      const { id, date, indexedAt, ...rest } = email;
      const emailBody = {
        ...rest,
        date: (date instanceof Date) ? date.toISOString() : date,
        indexedAt: (indexedAt instanceof Date) ? indexedAt.toISOString() : indexedAt
      };
      logger.info('Document to be indexed:', JSON.stringify(emailBody, null, 2));
      const indexResponse = await this.es.client.index({
        index: this.indexName,
        id: email.id,
        document: emailBody
      });
      logger.info('Elasticsearch index response:', JSON.stringify(indexResponse, null, 2));
      logger.info(`Indexed email: ${email.subject} (${email.id})`);
      return true;
    } catch (error) {
      logger.error('Error indexing email:', error);
      return false;
    }
  }

  async searchEmails(searchQuery: SearchQuery): Promise<{ emails: Email[]; total: number }> {
    try {
      const {
        query,
        accountId,
        folder,
        category,
        from,
        to,
        page = 1,
        size = 20
      } = searchQuery;
      const must: any[] = [];
      const filter: any[] = [];
      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ['subject^2', 'bodyText', 'from', 'to']
          }
        });
      }
      if (accountId) filter.push({ term: { accountId } });
      if (folder) filter.push({ term: { folder } });
      if (category) filter.push({ term: { category } });
      if (from || to) {
        const dateRange: any = {};
        if (from) dateRange.gte = from;
        if (to) dateRange.lte = to;
        filter.push({ range: { date: dateRange } });
      }
      const response = await this.es.client.search({
        index: this.indexName,
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter
          }
        },
        sort: [{ date: { order: 'desc' } }],
        from: (page - 1) * size,
        size
      });
      const emails = response.hits?.hits?.map((hit: any) => hit._source as Email) || [];
      const totalHits = response.hits?.total;
      const total = typeof totalHits === 'number' ? totalHits : totalHits?.value || 0;
      return { emails, total };
    } catch (error) {
      logger.error('Error searching emails:', error);
      return { emails: [], total: 0 };
    }
  }

  async updateEmailCategory(emailId: string, category: string, aiScore: number): Promise<boolean> {
    try {
      await this.es.client.update({
        index: this.indexName,
        id: emailId,
        doc: {
          category,
          aiScore
        }
      });
      logger.info(`Updated email category: ${emailId} -> ${category}`);
      return true;
    } catch (error) {
      logger.error('Error updating email category:', error);
      return false;
    }
  }

  async getEmailById(emailId: string): Promise<Email | null> {
    try {
      const response = await this.es.client.get({
        index: this.indexName,
        id: emailId
      });
      return response._source as Email;
    } catch (error: any) {
      if (error.statusCode !== 404) {
        logger.error('Error getting email by ID:', error);
      }
      return null;
    }
  }

  async getCategoryStats(): Promise<Record<string, number>> {
    try {
      const response = await this.es.client.search({
        index: this.indexName,
        size: 0,
        aggs: {
          categories: {
            terms: {
              field: 'category',
              size: 10
            }
          }
        }
      });
      const buckets = (response.aggregations as any)?.categories?.buckets || [];
      const stats: Record<string, number> = {};
      buckets.forEach((bucket: any) => {
        stats[bucket.key] = bucket.doc_count;
      });
      return stats;
    } catch (error) {
      logger.error('Error getting category stats:', error);
      return {};
    }
  }

  async getRecentEmails(limit: number = 10): Promise<Email[]> {
    try {
      const response = await this.es.client.search({
        index: this.indexName,
        query: { match_all: {} },
        sort: [{ date: { order: 'desc' } }],
        size: limit
      });
      return response.hits?.hits?.map((hit: any) => hit._source as Email) || [];
    } catch (error) {
      logger.error('Error getting recent emails:', error);
      return [];
    }
  }

  async getEmailsByCategory(category: string, limit: number = 50): Promise<Email[]> {
    try {
      const response = await this.es.client.search({
        index: this.indexName,
        query: {
          term: { category }
        },
        sort: [{ date: { order: 'desc' } }],
        size: limit
      });
      return response.hits?.hits?.map((hit: any) => hit._source as Email) || [];
    } catch (error) {
      logger.error('Error getting emails by category:', error);
      return [];
    }
  }
}