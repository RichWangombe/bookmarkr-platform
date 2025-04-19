import { Request, Response, Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { log } from '../vite';

// Schema for source suggestions
const sourceSuggestionSchema = z.object({
  name: z.string().min(2),
  websiteUrl: z.string().url(),
  rssUrl: z.string().url().optional().or(z.literal('')),
  category: z.enum(["technology", "business", "news", "science", "design", "ai"]),
  description: z.string().optional().or(z.literal('')),
  hasRssFeed: z.boolean().default(false),
});

// Router for suggestion endpoints
const suggestionsRouter = Router();

// Directory for storing suggestions
const SUGGESTIONS_DIR = path.join(process.cwd(), 'data', 'suggestions');

// Ensure suggestions directory exists
function ensureSuggestionsDir() {
  if (!fs.existsSync(SUGGESTIONS_DIR)) {
    try {
      // Create parent directory if it doesn't exist
      if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
        fs.mkdirSync(path.join(process.cwd(), 'data'));
      }
      fs.mkdirSync(SUGGESTIONS_DIR);
      log('Created suggestions directory', 'suggestions');
    } catch (error) {
      log(`Error creating suggestions directory: ${error}`, 'suggestions');
    }
  }
}

// Get all source suggestions
suggestionsRouter.get('/source', (req: Request, res: Response) => {
  try {
    ensureSuggestionsDir();
    
    // Read all suggestion files
    const files = fs.readdirSync(SUGGESTIONS_DIR);
    const suggestions = files
      .filter(file => file.endsWith('.json') && file.startsWith('source-'))
      .map(file => {
        const fileContent = fs.readFileSync(path.join(SUGGESTIONS_DIR, file), 'utf-8');
        try {
          return JSON.parse(fileContent);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
    
    return res.json(suggestions);
  } catch (error) {
    log(`Error getting source suggestions: ${error}`, 'suggestions');
    return res.status(500).json({ error: 'Failed to retrieve source suggestions' });
  }
});

// Submit a new source suggestion
suggestionsRouter.post('/source', (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = sourceSuggestionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid suggestion data', 
        details: validation.error.format() 
      });
    }
    
    const suggestion = validation.data;
    ensureSuggestionsDir();
    
    // Create a unique filename with timestamp
    const timestamp = new Date().getTime();
    const sanitizedName = suggestion.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `source-${sanitizedName}-${timestamp}.json`;
    
    // Add metadata for tracking
    const dataToSave = {
      ...suggestion,
      submitted: new Date().toISOString(),
      status: 'pending',
      id: `${sanitizedName}-${timestamp}`,
    };
    
    // Write to file
    fs.writeFileSync(
      path.join(SUGGESTIONS_DIR, filename),
      JSON.stringify(dataToSave, null, 2),
      'utf-8'
    );
    
    log(`New source suggestion received: ${suggestion.name}`, 'suggestions');
    return res.status(201).json({ success: true, id: dataToSave.id });
  } catch (error) {
    log(`Error storing source suggestion: ${error}`, 'suggestions');
    return res.status(500).json({ error: 'Failed to store source suggestion' });
  }
});

export default suggestionsRouter;