#!/usr/bin/env bun

// Script to combine all GraphQL bookmark files into a single comprehensive file
import { execSync } from 'child_process';

interface BookmarkData {
  exported_at: string;
  total_bookmarks: number;
  source: string;
  bookmarks: Bookmark[];
}

interface Bookmark {
  id: string;
  url: string;
  username: string;
  displayName: string;
  isVerified: boolean;
  text: string;
  timestamp: string;
  metrics: {
    replies: number;
    retweets: number;
    likes: number;
    bookmarks: number;
    views: number;
  };
  media: any[];
  isRetweet: boolean;
  isQuoteTweet: boolean;
  capturedAt: string;
  source: string;
}

interface CombinedData {
  exported_at: string;
  total_bookmarks: number;
  total_processed: number;
  total_duplicates: number;
  files_processed: number;
  source: string;
  version: string;
  bookmarks: Bookmark[];
}

console.log('🔄 Starting bookmark combination process...');

// Configure download directory - update this path based on where your files are saved
// Common locations:
// - Downloads: `${process.env.HOME}/Downloads`
// - Playwright temp: `/var/folders/.../playwright-mcp-output`
// - Current directory: `.`
const downloadsDir = process.env.BOOKMARK_FILES_DIR || `${process.env.HOME}/Downloads`;

console.log(`📁 Searching for files in: ${downloadsDir}`);

// Find all GraphQL bookmark files
const findCommand = `find "${downloadsDir}" -name "x-bookmarks-graphql-*.json"`;
const fileListOutput = execSync(findCommand, { encoding: 'utf8' });
const files = fileListOutput.trim().split('\n').filter(f => f);

console.log(`📁 Found ${files.length} GraphQL bookmark files`);

// Use Map to deduplicate bookmarks by ID
const allBookmarks = new Map<string, Bookmark>();
let totalProcessed = 0;
let totalDuplicates = 0;

// Process each file
for (const filePath of files) {
  try {
    console.log(`📖 Processing: ${filePath.split('/').pop()}`);
    
    const file = Bun.file(filePath);
    const content = await file.text();
    const data: BookmarkData = JSON.parse(content);
    
    if (data.bookmarks && Array.isArray(data.bookmarks)) {
      for (const bookmark of data.bookmarks) {
        if (bookmark.id) {
          if (allBookmarks.has(bookmark.id)) {
            totalDuplicates++;
          } else {
            allBookmarks.set(bookmark.id, bookmark);
          }
          totalProcessed++;
        }
      }
      console.log(`  ✅ Added ${data.bookmarks.length} bookmarks (${data.total_bookmarks || 'unknown'} total in file)`);
    }
  } catch (error) {
    console.warn(`  ⚠️  Error processing ${filePath}:`, error);
  }
}

// Convert Map to Array and sort by timestamp (newest first)
const uniqueBookmarks = Array.from(allBookmarks.values()).sort((a, b) => {
  const timeA = new Date(a.timestamp || a.capturedAt || 0);
  const timeB = new Date(b.timestamp || b.capturedAt || 0);
  return timeB.getTime() - timeA.getTime();
});

// Create final combined data structure
const combinedData: CombinedData = {
  exported_at: new Date().toISOString(),
  total_bookmarks: uniqueBookmarks.length,
  total_processed: totalProcessed,
  total_duplicates: totalDuplicates,
  files_processed: files.length,
  source: 'combined-graphql-interceptor',
  version: '1.0',
  bookmarks: uniqueBookmarks
};

// Generate timestamp for filename
const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
const outputPath = `${downloadsDir}/x-bookmarks-combined-${timestamp}.json`;

// Write combined file
await Bun.write(outputPath, JSON.stringify(combinedData, null, 2));

console.log('\n🎉 Bookmark combination completed!');
console.log(`📊 Statistics:`);
console.log(`   • Files processed: ${files.length}`);
console.log(`   • Total bookmarks processed: ${totalProcessed}`);
console.log(`   • Duplicate bookmarks removed: ${totalDuplicates}`);
console.log(`   • Final unique bookmarks: ${uniqueBookmarks.length}`);
console.log(`📄 Combined file saved to: ${outputPath}`);

// Also create a latest.json for easy access
const latestPath = `${downloadsDir}/x-bookmarks-latest.json`;
try {
  await Bun.write(latestPath, JSON.stringify(combinedData, null, 2));
  console.log(`🔗 Latest file available at: ${latestPath}`);
} catch (error) {
  console.warn(`⚠️  Could not create latest file:`, error);
}

console.log('\n✨ All done! Your complete bookmark collection is ready.');