import express from 'express';
import { ElasticsearchService } from '../services/elasticsearchService';
import { EmailCategory } from '../types';

const router = express.Router();
const esService = new ElasticsearchService();

// GET /emails/stats - Get category stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await esService.getCategoryStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get category stats' });
  }
});

// GET /emails/recent - Get recent emails
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const emails = await esService.getRecentEmails(limit);
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recent emails' });
  }
});

// GET /emails/category/:category - Get emails by category
router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category as EmailCategory;
    const limit = parseInt(req.query.limit as string) || 50;
    const emails = await esService.getEmailsByCategory(category, limit);
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get emails by category' });
  }
});

// GET /emails - General search/filtering
router.get('/', async (req, res) => {
  try {
    const { query, accountId, folder, category, from, to, page, size } = req.query;
    const searchQuery = {
      query: query as string,
      accountId: accountId as string,
      folder: folder as string,
      category: category ? (category as EmailCategory) : undefined,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      size: size ? parseInt(size as string) : 20
    };
    const result = await esService.searchEmails(searchQuery);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search emails' });
  }
});

// GET /emails/:id - Get email by ID
router.get('/:id', async (req, res) => {
  try {
    const email = await esService.getEmailById(req.params.id);
    if (!email) return res.status(404).json({ error: 'Email not found' });
    res.json(email);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get email by ID' });
  }
});

export default router;
