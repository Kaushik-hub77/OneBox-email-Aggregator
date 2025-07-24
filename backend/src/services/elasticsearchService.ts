import { ElasticsearchClient } from '../config/database';
import { Email, SearchQuery } from '../types';
import { logger } from '../utils/logger';

export class ElasticsearchService {
  private es = ElasticsearchClient.getInstance();
  private indexName = process.env.ELASTICSEARCH_INDEX || 'emails';

  async indexEmail(email: Email): Promise<boolean> {
    try {
      // Check if email already exists
      const existsResponse = await this.es.client.search({
        index: this.indexName,
        body: {
          query: {
            term: { messageId: email.messageId }
          }
        },
        size: 1
      });

      if (existsResponse.hits.total.value > 0) {
        logger.info(`Email already indexed: ${email.messageId}`);
        return false;
      }

      // Index the email
      await this.es.client.index({
        index: this.indexName,
        id: email.id,
        body: email
      });

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

      // Text search
      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ['subject^2', 'bodyText', 'from', 'to']
          }
        });
      }

      // Filters
      if (accountId) filter.push({ term: { accountId } });
      if (folder) filter.push({ term: { folder } });
      if (category) filter.push({ term: { category } });
      
      // Date range
      if (from || to) {
        const dateRange: any = {};
        if (from) dateRange.gte = from;
        if (to) dateRange.lte = to;
        filter.push({ range: { date: dateRange } });
      }

      const searchBody: any = {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter
          }
        },
        sort: [{ date: { order: 'desc' } }],
        from: (page - 1) * size,
        size
      };

      const response = await this.es.client.search({
        index: this.indexName,
        body: searchBody
      });

      const emails = response.hits.hits.map((hit: any) => hit._source as Email);
      const total = typeof response.hits.total === 'number' 
        ? response.hits.total 
        : response.hits.total.value;

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
        body: {
          doc: {
            category,
            aiScore
          }
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
    } catch (error) {
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
        body: {
          size: 0,
          aggs: {
            categories: {
              terms: {
                field: 'category',
                size: 10
              }
            }
          }
        }
      });

      const buckets = response.aggregations?.categories?.buckets || [];
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
        body: {
          query: { match_all: {} },
          sort: [{ date: { order: 'desc' } }],
          size: limit
        }
      });

      return response.hits.hits.map((hit: any) => hit._source as Email);
    } catch (error) {
      logger.error('Error getting recent emails:', error);
      return [];
    }
  }

  async getEmailsByCategory(category: EmailCategory, limit: number = 50): Promise<Email[]> {
    try {
      const response = await this.es.client.search({
        index: this.indexName,
        body: {
          query: {
            term: { category }
          },
          sort: [{ date: { order: 'desc' } }],
          size: limit
        }
      });

      return response.hits.hits.map((hit: any) => hit._source as Email);
    } catch (error) {
      logger.error('Error getting emails by category:', error);
      return [];
    }
  }
}