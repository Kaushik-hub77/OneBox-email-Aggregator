import express from 'express';
import { AIService } from '../services/aiService';
import { ElasticsearchService } from '../services/elasticsearchService';

const router = express.Router();
const aiService = new AIService();
const esService = new ElasticsearchService();

// POST /ai/suggested-reply/:id
router.post('/suggested-reply/:id', async (req, res) => {
  try {
    const email = await esService.getEmailById(req.params.id);
    if (!email) return res.status(404).json({ error: 'Email not found' });
    const reply = await aiService.generateSuggestedReply(email);
    res.json(reply);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate suggested reply' });
  }
});

export default router;

