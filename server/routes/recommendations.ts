import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { 
  getPersonalizedRecommendations, 
  getSimilarContent,
  getTopicBasedRecommendations,
  getDiscoveryRecommendations 
} from '../recommendation';

// Create router
export const recommendationsRouter = Router();

// GET /api/recommendations/personalized
// Get personalized recommendations based on user's bookmarks and behavior
recommendationsRouter.get('/personalized', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const recommendations = await getPersonalizedRecommendations(limit);
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    res.status(500).json({ error: 'Failed to generate personalized recommendations' });
  }
});

// GET /api/recommendations/similar/:id
// Get content similar to a specific bookmark
recommendationsRouter.get('/similar/:id', async (req: Request, res: Response) => {
  try {
    const bookmarkId = parseInt(req.params.id);
    
    if (isNaN(bookmarkId)) {
      return res.status(400).json({ error: 'Invalid bookmark ID' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const recommendations = await getSimilarContent(bookmarkId, limit);
    res.json(recommendations);
  } catch (error) {
    console.error(`Error getting similar content:`, error);
    res.status(500).json({ error: 'Failed to find similar content' });
  }
});

// GET /api/recommendations/topic/:topic
// Get recommendations for a specific topic
recommendationsRouter.get('/topic/:topic', async (req: Request, res: Response) => {
  try {
    const { topic } = req.params;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const recommendations = await getTopicBasedRecommendations(topic, limit);
    res.json(recommendations);
  } catch (error) {
    console.error(`Error getting topic-based recommendations:`, error);
    res.status(500).json({ error: 'Failed to generate topic-based recommendations' });
  }
});

// GET /api/recommendations/discover
// Get diverse discovery recommendations across categories
recommendationsRouter.get('/discover', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const recommendations = await getDiscoveryRecommendations(limit);
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting discovery recommendations:', error);
    res.status(500).json({ error: 'Failed to generate discovery recommendations' });
  }
});

export default recommendationsRouter;