const fs = require('fs');
const path = require('path');

function removeConsoleStatements(content) {
  // Split content into lines for processing
  const lines = content.split('\n');
  const cleanedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip lines that contain only console statements
    if (/^\s*console\.(log|error|warn|info|debug)\s*\(/.test(line)) {
      // Check if this is a multi-line console statement
      let j = i;
      let openParens = 0;
      let foundComplete = false;
      
      while (j < lines.length) {
        const currentLine = lines[j];
        
        // Count parentheses to find the end of the statement
        for (const char of currentLine) {
          if (char === '(') openParens++;
          if (char === ')') openParens--;
        }
        
        // If we've closed all parentheses and found a semicolon or end of line
        if (openParens === 0 && (currentLine.includes(';') || currentLine.includes(')'))) {
          foundComplete = true;
          i = j; // Skip all these lines
          break;
        }
        j++;
      }
      
      if (!foundComplete) {
        // If we couldn't find the end, just skip this line
        continue;
      }
    } else {
      // For lines that contain console statements mixed with other code
      let cleanedLine = line;
      
      // Remove inline console statements (simple cases)
      cleanedLine = cleanedLine.replace(/console\.(log|error|warn|info|debug)\([^)]*\);\s*/g, '');
      cleanedLine = cleanedLine.replace(/console\.(log|error|warn|info|debug)\([^)]*\)\s*$/g, '');
      
      cleanedLines.push(cleanedLine);
    }
  }
  
  return cleanedLines.join('\n');
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanedContent = removeConsoleStatements(content);
    
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent);
      console.log(`✅ Cleaned: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalCleaned = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      totalCleaned += processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (processFile(filePath)) {
        totalCleaned++;
      }
    }
  }
  
  return totalCleaned;
}

// Process only React components and pages (not API routes or utils initially)
const reactDirs = [
  './src/components',
  './src/pages'
];

let totalFiles = 0;
for (const dir of reactDirs) {
  if (fs.existsSync(dir)) {
    console.log(`\n🔍 Processing ${dir}...`);
    totalFiles += processDirectory(dir);
  }
}

console.log(`\n✨ Console cleanup complete! Processed ${totalFiles} files.`);
