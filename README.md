# X Bookmark Extractor with Claude Code

**An example repository demonstrating how to use Claude Code to download ALL of your X (Twitter) bookmarks with real engagement metrics.**

This project showcases the power of combining Claude Code with the Playwright MCP server to automate web interactions and data extraction. With just a few simple steps, you can extract your complete bookmark collection including real metrics that aren't available through X's standard interface.

## 🚀 Quick Setup

### Step 1: Add the Playwright MCP Server

First, add the Playwright MCP server to Claude Code:

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

### Step 2: Clone and Setup

```bash
git clone <this-repo>
cd cc-scrape-x-bookmarks
bun install
```

### Step 3: Open Claude Code and Point to Instructions

Load Claude Code and point it to the `CLAUDE.md` file in this repository, which contains detailed step-by-step instructions for the extraction process.

## 🎯 How It Works

1. **Login**: Navigate to X bookmarks and login with your account
2. **Inject**: Load the GraphQL interceptor script that captures real API data
3. **Extract**: Auto-scroll through your bookmarks while capturing complete data
4. **Combine**: Merge all extracted files into a single comprehensive collection

## 📊 What You Get

- **Complete bookmark collection** (not just the 5-10 visible ones)
- **Real engagement metrics** (likes, retweets, replies, views, bookmarks)
- **Full user data** (verification status, display names, profile info)
- **Media attachments** (photos, videos with URLs)
- **Accurate timestamps and permalinks**
- **Automatic deduplication**

## 🔧 Usage

After setup, simply tell Claude Code to follow the instructions in `CLAUDE.md`. The process is fully automated - Claude will:

1. Navigate to your X bookmarks page
2. Wait for you to login
3. Inject the GraphQL interceptor
4. Auto-scroll and capture all data
5. Download JSON files with your complete collection

## 📁 Output Files

- `x-bookmarks-graphql-*.json` - Individual extraction files
- `x-bookmarks-combined-*.json` - All bookmarks in one file  
- `x-bookmarks-latest.json` - Easy access to most recent extraction

To combine multiple files:
```bash
bun combine-bookmarks.ts
```

## 🙏 Credits

This project is heavily inspired by and builds upon the excellent [Twitter Web Exporter](https://github.com/prinsss/twitter-web-exporter) by [@prinsss](https://github.com/prinsss). All credit for the GraphQL interceptor techniques and approach goes to their original work.

## 🎉 Ready to Start?

1. Add the Playwright MCP server to Claude Code
2. Clone this repository
3. Open Claude Code and point it to the `CLAUDE.md` instructions
4. Follow the automated extraction process

Your complete X bookmark collection will be extracted with full fidelity in just a few minutes!
# cc-scrape-x-bookmarks
