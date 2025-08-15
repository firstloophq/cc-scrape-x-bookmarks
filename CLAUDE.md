# X Bookmark Extractor - Simple Guide

**Extract ALL your X (Twitter) bookmarks with real engagement metrics in 3 simple steps.**

## 🚀 Quick Start (5 minutes)

### Step 1: Navigate to X Bookmarks
```javascript
// In Claude Code with Playwright MCP
await mcp__playwright__browser_navigate({ url: "https://x.com/i/bookmarks" });
```


### Step 1.5: Login
Let the user login with their account. They will provide confirmation before you continue

### Step 2: Inject the GraphQL Interceptor
```javascript
// Load and execute the interceptor script
const script = await Bun.file('./graphql-interceptor.js').text();
await mcp__playwright__browser_evaluate({ 
  function: `() => { ${script} }`, 
  element: "GraphQL interceptor injection" 
});
```

### Step 3: Wait and Watch! 🎉
The system will automatically:
- ✅ Start capturing bookmarks from GraphQL API
- ✅ Auto-scroll through your entire bookmark collection
- ✅ Download JSON files with complete data and real metrics
- ✅ Show progress in browser console

**That's it!** Your complete bookmark collection will be extracted automatically.

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