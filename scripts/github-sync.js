// Automated GitHub sync script
const { execSync } = require('child_process');
const path = require('path');

// Execute shell command and print output
function run(command) {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Main function to sync with GitHub
async function syncWithGitHub() {
  console.log('Starting GitHub sync...');
  
  // Configure Git user (if needed)
  run('git config --global user.name "Replit Automated Sync"');
  run('git config --global user.email "automated@example.com"');
  
  // Create a timestamp for the commit message
  const timestamp = new Date().toISOString();
  
  // Add all changes
  run('git add .');
  
  // Commit with timestamp
  const commitMessage = `Automated sync: ${timestamp}`;
  run(`git commit -m "${commitMessage}" || true`);
  
  // Push to GitHub
  // Note: This requires GH_TOKEN as a secret in your Replit project
  const token = process.env.GH_TOKEN;
  if (!token) {
    console.error('Error: GH_TOKEN environment variable not set');
    return;
  }
  
  // Use the token for authentication
  const repoUrl = 'https://github.com/RichWangombe/bookmarkr-platform';
  const tokenizedUrl = `https://${token}@github.com/RichWangombe/bookmarkr-platform`;
  
  run(`git push ${tokenizedUrl} main`);
  
  console.log('GitHub sync completed successfully!');
}

// Run the sync function
syncWithGitHub().catch(error => {
  console.error('Sync failed:', error);
});