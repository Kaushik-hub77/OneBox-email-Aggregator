import { Client } from '@elastic/elasticsearch';

class ElasticsearchClient {
  public client: Client;
  private static instance: ElasticsearchClient;

  private constructor() {
    this.client = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });
  }

  public static getInstance(): ElasticsearchClient {
    if (!ElasticsearchClient.instance) {
      ElasticsearchClient.instance = new ElasticsearchClient();
    }
    return ElasticsearchClient.instance;
  }
}

export { ElasticsearchClient };