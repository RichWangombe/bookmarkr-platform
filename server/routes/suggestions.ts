import { Router, Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Create router
const suggestionsRouter = Router();
export default suggestionsRouter;

// Define validation schema
const sourceSuggestionSchema = z.object({
  name: z.string().min(2, { message: "Source name must be at least 2 characters" }),
  url: z.string().url({ message: "Please enter a valid URL" }),
  category: z.string().min(1, { message: "Please select a category" }),
  rssUrl: z.string().url({ message: "Please enter a valid RSS URL" }).optional().or(z.literal("")),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
});

// Create suggestions directory if it doesn't exist
function ensureSuggestionsDir() {
  const suggestionsDir = path.join(process.cwd(), 'suggestions');
  if (!fs.existsSync(suggestionsDir)) {
    fs.mkdirSync(suggestionsDir, { recursive: true });
  }
  return suggestionsDir;
}

// GET /api/suggestions/source
// Retrieves all source suggestions
suggestionsRouter.get('/source', (req: Request, res: Response) => {
  try {
    const suggestionsDir = ensureSuggestionsDir();
    const files = fs.readdirSync(suggestionsDir);
    const suggestions = files
      .filter(file => file.startsWith('source-') && file.endsWith('.json'))
      .map(file => {
        const content = fs.readFileSync(path.join(suggestionsDir, file), 'utf-8');
        return JSON.parse(content);
      });
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// POST /api/suggestions/source
// Saves a new source suggestion
suggestionsRouter.post('/source', (req: Request, res: Response) => {
  try {
    // Validate the request body
    const validationResult = sourceSuggestionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid suggestion data', 
        details: validationResult.error.format() 
      });
    }

    const suggestion = validationResult.data;
    
    // Add timestamp and ID
    const data = {
      id: `source-${Date.now()}`,
      ...suggestion,
      submittedAt: new Date().toISOString(),
      status: 'pending', // pending, approved, rejected
    };
    
    // Create suggestions directory if it doesn't exist
    const suggestionsDir = ensureSuggestionsDir();
    
    // Write the suggestion to a file
    const filename = `source-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(suggestionsDir, filename),
      JSON.stringify(data, null, 2)
    );
    
    res.status(201).json({ success: true, id: data.id });
  } catch (error) {
    console.error('Error saving suggestion:', error);
    res.status(500).json({ error: 'Failed to save suggestion' });
  }
});