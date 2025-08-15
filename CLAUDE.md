# X Bookmark Extractor - Complete Process

**Extract ALL your X (Twitter) bookmarks with real engagement metrics.**

## 🚀 Complete Process

### Step 1: Navigate to X Bookmarks
```javascript
await mcp__playwright__browser_navigate({ url: "https://x.com/i/bookmarks" });
```

### Step 2: User Login
Let user login with their X account. Wait for confirmation before continuing.

### Step 3: Read and Inject GraphQL Interceptor
```javascript
const script = await Bun.file('./graphql-interceptor.js').text();
await mcp__playwright__browser_evaluate({ 
  function: `() => { ${script} }`, 
  element: "GraphQL interceptor injection" 
});
```

### Step 4: Monitor Auto-Extraction
The system auto-scrolls and captures all bookmarks. Monitor progress in console.

### Step 5: Find Downloads Location
```javascript
await mcp__playwright__browser_evaluate({ 
  function: `() => {
    const count = window.bookmarkInterceptor ? window.bookmarkInterceptor.getBookmarkCount() : 'Not found';
    return \`Bookmark count: \${count}\`;
  }`, 
  element: "Check bookmark count and download location" 
});
```

### Step 6: Combine All Files
```bash
BOOKMARK_FILES_DIR="/var/folders/.../playwright-mcp-output" bun combine-bookmarks.ts
```

### Step 7: Copy to Current Directory
```bash
cp "/path/to/x-bookmarks-latest.json" ./
```

## 📊 What You Get

- **All bookmarks** (not just 5-10 visible ones)
- **Real engagement metrics** (likes, retweets, replies, views)
- **Complete user data** (verification status, display names) 
- **Media attachments** (photos, videos)
- **Timestamps and URLs**
- **Automatic deduplication**

## 🔄 Combine Multiple Files (Optional)

After extraction, combine all files into one:

```bash
# Run the combination script (searches ~/Downloads by default)
bun combine-bookmarks.ts

# Or specify a custom directory where your files are located
BOOKMARK_FILES_DIR="/var/folders/.../playwright-mcp-output" bun combine-bookmarks.ts
```

**Tip**: Use the JavaScript evaluation above to find your exact file location, then set `BOOKMARK_FILES_DIR` to that path.

## 📋 Console Output Example

```
📚 X Bookmark GraphQL Interceptor started!
🤖 Auto-scroll will begin in 3 seconds...
📜 Auto-scroll 1/10000 - Scrolled to: 7208
[X-Bookmarks-GraphQL] Captured 20 bookmarks (total: 40)
[X-Bookmarks-GraphQL] Downloaded 40 bookmarks to x-bookmarks-graphql-*.json
```

## 🛑 Manual Control (If Needed)

```javascript
// Check progress
window.bookmarkInterceptor.getBookmarkCount()

// Stop auto-scroll
window.bookmarkInterceptor.uninstall()

// Force save current data
window.bookmarkInterceptor.saveBookmarks()
```

## 📂 Finding Your Downloaded Files

Before combining files, you can check where Playwright is saving the extracted bookmark files:

```javascript
// Use this in Claude Code to check download location and file count
await mcp__playwright__browser_evaluate({ 
  function: `() => {
    // Check current status only
    const count = window.bookmarkInterceptor ? window.bookmarkInterceptor.getBookmarkCount() : 'Not found';
    return \`Bookmark count: \${count}\`;
  }`, 
  element: "Check bookmark count only" 
});
```

This will show you both:
- Current bookmark count extracted
- The file download location (usually `/var/folders/.../playwright-mcp-output/`)

**Note**: Once you know the download location, update the `combine-bookmarks.ts` file to point to the correct directory before running the combination script.

## 🎯 Results

- **Individual files**: `x-bookmarks-graphql-*.json` (real-time saves)
- **Combined file**: `x-bookmarks-combined-*.json` (all bookmarks in one file)
- **Latest file**: `x-bookmarks-latest.json` (easy access to most recent)

**Perfect for**: Backing up bookmarks, data analysis, building personal tools, archiving collections.

---

**🎉 Ready to extract your entire X bookmark collection? Just copy-paste the 3 steps above!**