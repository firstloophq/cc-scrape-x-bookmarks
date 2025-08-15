// GraphQL Bookmark Interceptor for X (Twitter)
// Based on Twitter Web Exporter approach
// This script intercepts GraphQL API calls to capture all bookmark data

class BookmarkGraphQLInterceptor {
  constructor() {
    this.bookmarks = new Map(); // Use Map to deduplicate by ID
    this.isActive = false;
    this.originalXHROpen = null;
    this.logPrefix = '[X-Bookmarks-GraphQL]';
  }

  log(message, ...args) {
    console.log(this.logPrefix, message, ...args);
  }

  warn(message, ...args) {
    console.warn(this.logPrefix, message, ...args);
  }

  error(message, ...args) {
    console.error(this.logPrefix, message, ...args);
  }

  // Install XMLHttpRequest hooks to intercept API calls
  install() {
    if (this.isActive) {
      this.warn('GraphQL interceptor is already active');
      return;
    }

    // Store original XMLHttpRequest.open method
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    const self = this;

    // Override XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      // Apply the original open method
      self.originalXHROpen.apply(this, [method, url, ...args]);

      // Check if this is a bookmark GraphQL request
      if (self.isBookmarkRequest(url)) {
        self.log('Detected bookmark GraphQL request:', url);

        // Add load event listener to capture response
        this.addEventListener('load', function() {
          self.handleBookmarkResponse(this, method, url);
        });
      }
    };

    this.isActive = true;
    this.log('GraphQL interceptor installed');
    
    // Check execution context
    this.checkExecutionContext();
  }

  // Remove XMLHttpRequest hooks
  uninstall() {
    if (!this.isActive) {
      this.warn('GraphQL interceptor is not active');
      return;
    }

    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
      this.originalXHROpen = null;
    }

    this.isActive = false;
    this.log('GraphQL interceptor uninstalled');
  }

  // Check if the URL is a bookmark GraphQL request
  isBookmarkRequest(url) {
    // Match bookmark GraphQL endpoints
    return /\/graphql\/.+\/Bookmarks/.test(url);
  }

  // Check execution context (similar to Twitter Web Exporter)
  checkExecutionContext() {
    setTimeout(() => {
      // Check for Twitter-specific global objects to ensure we're in the right context
      if (!window.webpackChunk_twitter_responsive_web && !window.__MAIN_BUNDLE__) {
        this.error(
          'Warning: Wrong execution context detected.\n' +
          'This script needs to be injected into "page" context rather than "content" context.\n' +
          'The XMLHttpRequest hook may not work properly.'
        );
      } else {
        this.log('Execution context check passed');
      }
    }, 1000);
  }

  // Handle bookmark GraphQL response
  handleBookmarkResponse(xhr, method, url) {
    try {
      if (xhr.status !== 200) {
        this.warn(`Non-200 response for ${url}:`, xhr.status);
        return;
      }

      const responseText = xhr.responseText;
      if (!responseText) {
        this.warn('Empty response for', url);
        return;
      }

      const json = JSON.parse(responseText);
      const newBookmarks = this.extractBookmarksFromResponse(json);
      
      if (newBookmarks.length > 0) {
        // Add new bookmarks to our collection
        newBookmarks.forEach(bookmark => {
          this.bookmarks.set(bookmark.id, bookmark);
        });

        this.log(`Captured ${newBookmarks.length} bookmarks (total: ${this.bookmarks.size})`);
        
        // Trigger storage update
        this.saveBookmarks();
      }

    } catch (err) {
      this.error('Failed to parse bookmark response:', err);
      this.error('URL:', url);
      this.error('Response:', xhr.responseText?.substring(0, 500) + '...');
    }
  }

  // Extract bookmark data from GraphQL response (based on Twitter Web Exporter logic)
  extractBookmarksFromResponse(json) {
    const newBookmarks = [];

    try {
      // Navigate to bookmark timeline instructions
      const instructions = json?.data?.bookmark_timeline_v2?.timeline?.instructions;
      
      if (!instructions || !Array.isArray(instructions)) {
        this.warn('No timeline instructions found in response');
        return newBookmarks;
      }

      // Find TimelineAddEntries instruction
      const timelineAddEntriesInstruction = instructions.find(
        instruction => instruction.type === 'TimelineAddEntries'
      );

      if (!timelineAddEntriesInstruction) {
        this.warn('No TimelineAddEntries instruction found');
        return newBookmarks;
      }

      const entries = timelineAddEntriesInstruction.entries || [];
      
      for (const entry of entries) {
        // Extract tweet from timeline entry
        if (this.isTimelineEntryTweet(entry)) {
          const bookmark = this.extractBookmarkFromTimelineEntry(entry);
          if (bookmark) {
            newBookmarks.push(bookmark);
          }
        }
      }

    } catch (err) {
      this.error('Error extracting bookmarks:', err);
    }

    return newBookmarks;
  }

  // Check if timeline entry is a tweet
  isTimelineEntryTweet(entry) {
    return (
      entry?.content?.entryType === 'TimelineTimelineItem' &&
      entry?.entryId?.startsWith('tweet-') &&
      entry?.content?.itemContent?.__typename === 'TimelineTweet'
    );
  }

  // Extract bookmark data from timeline entry
  extractBookmarkFromTimelineEntry(entry) {
    try {
      const tweetContent = entry.content.itemContent;
      const tweetResult = tweetContent?.tweet_results?.result;

      if (!tweetResult) {
        this.warn('No tweet result found in timeline entry');
        return null;
      }

      // Handle different tweet result types
      let tweet = null;
      if (tweetResult.__typename === 'Tweet') {
        tweet = tweetResult;
      } else if (tweetResult.__typename === 'TweetWithVisibilityResults') {
        tweet = tweetResult.tweet;
      } else {
        this.warn('Unsupported tweet type:', tweetResult.__typename);
        return null;
      }

      if (!tweet || !tweet.legacy) {
        this.warn('Empty tweet or missing legacy data');
        return null;
      }

      // Extract bookmark data
      const user = tweet.core?.user_results?.result;
      if (!user) {
        this.warn('No user data found in tweet');
        return null;
      }

      const bookmark = {
        id: tweet.rest_id,
        url: `https://x.com/${user.core.screen_name}/status/${tweet.legacy.id_str}`,
        username: user.core.screen_name,
        displayName: user.core.name,
        isVerified: user.verification?.verified || false,
        text: this.extractTweetText(tweet),
        timestamp: this.parseTwitterDateTime(tweet.legacy.created_at),
        metrics: {
          replies: tweet.legacy.reply_count || 0,
          retweets: tweet.legacy.retweet_count || 0,
          likes: tweet.legacy.favorite_count || 0,
          bookmarks: tweet.legacy.bookmark_count || 0,
          views: this.parseViewCount(tweet.views?.count) || 0
        },
        media: this.extractTweetMedia(tweet),
        isRetweet: !!tweet.legacy.retweeted_status_result,
        isQuoteTweet: tweet.legacy.is_quote_status || false,
        capturedAt: new Date().toISOString(),
        source: 'graphql-api'
      };

      return bookmark;

    } catch (err) {
      this.error('Error extracting bookmark from timeline entry:', err);
      return null;
    }
  }

  // Extract tweet text (handle note tweets for long content)
  extractTweetText(tweet) {
    return tweet.note_tweet?.note_tweet_results?.result?.text || tweet.legacy.full_text;
  }

  // Parse Twitter datetime format
  parseTwitterDateTime(dateStr) {
    try {
      // Convert "Thu Sep 28 11:07:25 +0000 2023" to ISO format
      const date = new Date(dateStr);
      return date.toISOString();
    } catch (err) {
      this.warn('Failed to parse date:', dateStr, err);
      return new Date().toISOString();
    }
  }

  // Parse view count (can be string)
  parseViewCount(viewCount) {
    if (typeof viewCount === 'string') {
      return parseInt(viewCount, 10) || 0;
    }
    return viewCount || 0;
  }

  // Extract media from tweet
  extractTweetMedia(tweet) {
    const media = [];
    
    try {
      // Use extended_entities first, then fallback to entities
      const mediaEntities = tweet.legacy.extended_entities?.media || tweet.legacy.entities?.media || [];
      
      for (const mediaItem of mediaEntities) {
        media.push({
          id: mediaItem.id_str,
          type: mediaItem.type,
          url: mediaItem.media_url_https,
          expanded_url: mediaItem.expanded_url,
          alt_text: mediaItem.ext_alt_text || ''
        });
      }
    } catch (err) {
      this.warn('Error extracting media:', err);
    }

    return media;
  }

  // Save bookmarks to storage
  saveBookmarks() {
    try {
      const bookmarksList = Array.from(this.bookmarks.values());
      const exportData = {
        exported_at: new Date().toISOString(),
        total_bookmarks: bookmarksList.length,
        source: 'graphql-interceptor',
        bookmarks: bookmarksList
      };

      // Store in localStorage for persistence
      localStorage.setItem('x-bookmarks-graphql-data', JSON.stringify(exportData));
      
      // Also trigger download
      this.downloadBookmarks(exportData);

    } catch (err) {
      this.error('Failed to save bookmarks:', err);
    }
  }

  // Download bookmarks as JSON file
  downloadBookmarks(exportData) {
    try {
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `x-bookmarks-graphql-${timestamp}.json`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.log(`Downloaded ${exportData.total_bookmarks} bookmarks to ${filename}`);
    } catch (err) {
      this.error('Failed to download bookmarks:', err);
    }
  }

  // Get current bookmark count
  getBookmarkCount() {
    return this.bookmarks.size;
  }

  // Get all bookmarks as array
  getAllBookmarks() {
    return Array.from(this.bookmarks.values());
  }

  // Clear all captured bookmarks
  clearBookmarks() {
    this.bookmarks.clear();
    localStorage.removeItem('x-bookmarks-graphql-data');
    this.log('Cleared all bookmarks');
  }

  // Load bookmarks from localStorage
  loadBookmarks() {
    try {
      const stored = localStorage.getItem('x-bookmarks-graphql-data');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.bookmarks && Array.isArray(data.bookmarks)) {
          data.bookmarks.forEach(bookmark => {
            this.bookmarks.set(bookmark.id, bookmark);
          });
          this.log(`Loaded ${this.bookmarks.size} bookmarks from storage`);
        }
      }
    } catch (err) {
      this.error('Failed to load bookmarks from storage:', err);
    }
  }
}

// Create global instance
window.bookmarkInterceptor = new BookmarkGraphQLInterceptor();

// Auto-scroll functionality
function startAutoScroll() {
  let scrollCount = 0;
  const maxScrolls = 50; // Adjust based on bookmark count
  const scrollDelay = 2000; // 2 seconds between scrolls
  
  function performScroll() {
    if (scrollCount >= maxScrolls) {
      console.log('🏁 Auto-scroll completed. Reached maximum scroll limit.');
      return;
    }
    
    const currentHeight = document.body.scrollHeight;
    window.scrollTo(0, currentHeight);
    scrollCount++;
    
    console.log(`📜 Auto-scroll ${scrollCount}/${maxScrolls} - Scrolled to: ${currentHeight}`);
    
    // Check if we've reached the bottom (no new content loaded)
    setTimeout(() => {
      if (document.body.scrollHeight === currentHeight) {
        console.log('🏁 Auto-scroll completed. Reached bottom of page.');
        return;
      }
      performScroll();
    }, scrollDelay);
  }
  
  // Start scrolling after initial load
  setTimeout(performScroll, 3000);
}

// Auto-start if we're on the bookmarks page
if (window.location.pathname === '/i/bookmarks') {
  window.bookmarkInterceptor.loadBookmarks();
  window.bookmarkInterceptor.install();
  
  console.log('📚 X Bookmark GraphQL Interceptor started!');
  console.log('🤖 Auto-scroll will begin in 3 seconds...');
  console.log('Use window.bookmarkInterceptor for manual control:');
  console.log('  - .getBookmarkCount() - Get current count');
  console.log('  - .getAllBookmarks() - Get all captured bookmarks');
  console.log('  - .saveBookmarks() - Force save/download');
  console.log('  - .clearBookmarks() - Clear all data');
  console.log('  - .uninstall() - Stop intercepting');
  
  // Start auto-scrolling
  startAutoScroll();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookmarkGraphQLInterceptor;
}