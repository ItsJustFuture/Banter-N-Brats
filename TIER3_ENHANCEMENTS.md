# Tier 3: Modern Web Features & Scalability Enhancements

## Overview

This document describes the modern web features and scalability improvements added in Tier 3, building on the infrastructure from Tier 1 and Tier 2.

## Components

### 1. Markdown Rendering with XSS Protection

Full markdown rendering support for chat messages with comprehensive security measures.

#### Features

- **Markdown-it Integration**: Complete markdown syntax support
  - Headings (H1-H6)
  - Bold, italic, strikethrough, underline
  - Code blocks and inline code
  - Lists (ordered and unordered)
  - Blockquotes
  - Horizontal rules
  - Links (auto-linkified)
  - Line breaks

- **DOMPurify Sanitization**: XSS protection through HTML sanitization
  - Removes malicious scripts and event handlers
  - Allows only safe HTML tags and attributes
  - Prevents data exfiltration attempts

- **Mention Highlighting**: Safe DOM-based mention detection
  - Highlights @username mentions in messages
  - Uses DOM manipulation to avoid XSS vulnerabilities
  - Works seamlessly with markdown rendering

#### Implementation

```javascript
// Messages are rendered with markdown and sanitized
const html = renderMarkdownWithMentions(text);
element.innerHTML = html;

// Markdown renderer configured with:
// - html: false (no raw HTML)
// - breaks: true (newlines become <br>)
// - linkify: true (auto-convert URLs)
```

#### Security

- Content Security Policy (CSP) allows CDN resources: `cdn.jsdelivr.net`
- All markdown output sanitized with DOMPurify
- Allowed HTML tags limited to safe presentation elements
- No JavaScript execution allowed in messages
- Mention highlighting uses DOM APIs, not string replacement

### 2. Progressive Web App (PWA) Support

Native app-like experience with offline functionality and installability.

#### Features

- **Manifest Configuration**: App metadata for installation
  - App name: "Banter & Brats"
  - Theme color: `#6c5ce7`
  - Display: standalone
  - Icons: 192x192 and 512x512 PNG

- **Service Worker**: Offline support and caching
  - Cache-first strategy for static assets
  - Network-first strategy for dynamic content
  - Automatic cache cleanup on updates
  - Graceful offline fallback pages

- **Installation Support**: Install as native app
  - iOS Safari: Add to Home Screen
  - Android Chrome: Install prompt
  - Desktop: Install from browser menu

#### Service Worker Caching

```javascript
// Static assets cached on install
const STATIC_ASSETS = [
  '/',
  '/app.js',
  '/theme-init.js',
  '/styles.css',
  '/manifest.json',
];

// Cache strategies:
// - Static: Cache-first with network fallback
// - Dynamic: Network-first with cache fallback
// - API: Network-only (always fresh)
```

#### Update Management

- Service worker checks for updates every 6 hours
- Console notification when update available
- Users can refresh to apply updates
- Old caches automatically cleaned on activation

### 3. Redis Adapter for Horizontal Scaling

Socket.IO Redis adapter enables multi-instance deployment for high availability.

#### Features

- **Redis Pub/Sub**: Synchronizes Socket.IO events across instances
- **Graceful Fallback**: Uses in-memory adapter when Redis unavailable
- **Error Handling**: Robust error logging and recovery
- **Connection Management**: Separate pub/sub clients for reliability

#### Configuration

Set the `REDIS_URL` environment variable:

```bash
# Local Redis
REDIS_URL=redis://localhost:6379

# Cloud Redis (e.g., Redis Cloud)
REDIS_URL=redis://user:password@host:port

# Render.com private Redis
REDIS_PRIVATE_URL=redis://...
```

#### Scaling Benefits

- **Horizontal Scaling**: Run multiple server instances
- **Load Balancing**: Distribute WebSocket connections
- **High Availability**: No single point of failure
- **Session Persistence**: Users stay connected during deploys

#### Fallback Behavior

If Redis is not configured or unavailable:
- Server logs: `[Redis] No REDIS_URL configured - using default in-memory adapter`
- Application continues working with single-instance mode
- No functionality loss, only scaling limitation

### 4. Persistent Read/Delivery Receipts

Database-backed message read tracking that survives server restarts.

#### Database Schema

**message_read_receipts** (Room Messages)
- `message_id`: Message being read
- `room_name`: Room containing the message
- `user_id`: User who read it
- `read_at`: Timestamp of read

**dm_read_tracking** (DM Threads)
- `thread_id`: DM conversation
- `user_id`: User who read messages
- `last_read_message_id`: Last message read
- `last_read_at`: Timestamp of last read

**message_delivery_receipts** (Delivery Status)
- `message_id`: Message delivered
- `room_name`: Room or thread
- `user_id`: User who received it
- `delivered_at`: Delivery timestamp

#### Socket.IO Events

**Room Messages:**
```javascript
// Client marks message as read
socket.emit('message mark read', {
  messageId: 12345,
  room: 'main'
});

// Server broadcasts to room
socket.on('message read', ({ messageId, room, userId, ts }) => {
  // Update UI to show read indicator
});
```

**DM Messages:**
```javascript
// Client marks DM as read
socket.emit('dm mark read', {
  threadId: 67890,
  messageId: 12345,
  ts: Date.now()
});

// Server broadcasts to thread participants
socket.on('dm read', ({ threadId, userId, messageId, ts }) => {
  // Update UI to show read indicator
});
```

#### Security

- Room membership validated before recording receipts
- Users can only mark messages in rooms they've joined
- Database errors logged but don't crash server
- Race conditions handled with UNIQUE constraints

### 5. Database Migrations

New migration file for read receipts: `migrations/20250201_read_receipts.sql`

#### SQLite (Development)

Tables created automatically in `database.js`:
- `message_read_receipts`
- `dm_read_tracking`
- `message_delivery_receipts`

Indexes:
- By message ID (fast lookup)
- By user ID (user's read history)
- By room/thread (conversation-level queries)

#### PostgreSQL (Production)

Migration file executed on deployment:
- Same logical schema as SQLite, using PostgreSQL-appropriate types
- Uses `SERIAL` or identity columns for auto-incrementing primary keys
- Prevents ID reuse for deleted rows

#### Migration Safety

- `CREATE TABLE IF NOT EXISTS` prevents conflicts
- `CREATE INDEX IF NOT EXISTS` idempotent
- UNIQUE constraints prevent duplicate entries
- Migration can be safely re-run

## Testing

### Syntax Validation

```bash
npm run check
```

Validates:
- server.js
- public/app.js
- public/theme-init.js
- database.js

### Server Startup

```bash
SESSION_SECRET="your-secret-here" npm run dev
```

Expected output:
```
[Redis] No REDIS_URL configured - using default in-memory adapter
[db] PG unavailable, using SQLite dev fallback
✓ State persistence tables created
Server running on http://localhost:3000
```

### Security Scanning

All security checks passing:
- CodeQL: 0 vulnerabilities found
- No XSS vulnerabilities
- CSP properly configured
- Input validation on all handlers

## Performance Considerations

### Markdown Rendering

- Rendered on client side (no server overhead)
- Cached markdown-it instance
- Graceful fallback to plain text

### Service Worker

- Static assets cached after first load
- Reduces bandwidth on repeat visits
- 6-hour update check interval
- Cache-first for static assets, network-first for dynamic requests

### Redis Scaling

- Optional feature (no performance impact without Redis)
- Reduces memory usage per instance
- Enables infinite horizontal scaling
- Sub-millisecond pub/sub latency

### Read Receipts

- Database writes are async (non-blocking)
- Indexes optimize queries
- Broadcasts throttled by Socket.IO
- No impact on message sending speed

## Browser Compatibility

### Markdown & DOMPurify
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### PWA Features
- Chrome 90+ (full support)
- Firefox 90+ (limited, no install prompt)
- Safari 14+ (iOS: Add to Home Screen)
- Edge 90+ (full support)

### Service Workers
- Chrome 40+
- Firefox 44+
- Safari 11.1+
- Edge 17+

## Deployment Notes

### Environment Variables

```bash
# Required
SESSION_SECRET=your-strong-secret-here

# Optional
REDIS_URL=redis://host:port           # For horizontal scaling
DATABASE_URL=postgresql://...          # For production database
```

### CDN Dependencies

External resources loaded from CDN:
- `cdn.jsdelivr.net/npm/markdown-it@14` (Markdown renderer)
- `cdn.jsdelivr.net/npm/dompurify@3` (XSS sanitizer)

These are allowed in CSP and cached by service worker.

### Database Migrations

On first deployment with these changes:
1. SQLite: Tables created automatically on startup
2. Postgres: Run migration file if needed
3. Indexes created during migration

### Monitoring

Watch for these log messages:
- `[Redis] ✓ Socket.IO Redis adapter connected successfully`
- `[PWA] Service Worker registered`
- `✓ State persistence tables created`

Error indicators:
- `[Redis] ✗ Failed to connect Redis adapter`
- `[PWA] Service Worker registration failed`
- `[message mark read] Error:` (database issues)

## Future Enhancements

### Markdown Features
- [ ] Markdown preview in compose box
- [ ] Custom emoji support
- [ ] @channel mentions
- [ ] Syntax highlighting for code blocks

### PWA Features
- [ ] Push notifications for mentions
- [ ] Background sync for offline messages
- [ ] Install promotion banner
- [ ] Offline message queue

### Read Receipts
- [ ] UI indicators for read messages
- [ ] Delivery status indicators
- [ ] Read by count (e.g., "Read by 5")
- [ ] Typing indicators persistence

### Redis Scaling
- [ ] Redis cluster support
- [ ] Automatic failover
- [ ] Connection pooling
- [ ] Metrics and monitoring
