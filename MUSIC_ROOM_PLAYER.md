# Music Room Global YouTube Player

## Overview

The Music Room now features a globally synchronized YouTube player that automatically plays videos shared in the room. This creates a shared listening experience where all users in the music room hear the same content simultaneously.

## Features

### 1. Automatic Link Detection
- When a user posts a YouTube link in the music room, it's automatically detected and removed from the chat
- A system message is posted announcing: "[Username] added: [Video Title]"
- The video is automatically added to the global queue

### 2. Queue System
- Videos are queued in order they are posted
- If no video is playing, the first video in queue starts automatically
- When a video ends, the next video in queue plays automatically
- Users can see the current queue in the player interface
- Skip button allows moving to the next video in queue

### 3. Per-User Quality Settings
All quality settings are stored locally and do not affect other users' experience:

#### Default Quality
- Videos default to 720p quality (or highest available if 720p not available)
- This provides a good balance between quality and bandwidth

#### Audio Only Mode
- Toggleable with the 🎵 button
- Hides the video player while keeping the same minimal controls (skip, audio-only, and low quality)
- Does not show standard YouTube controls such as pause/play button, seek bar, or volume slider
- Saves bandwidth for users who only want to listen
- Preference persists across sessions

#### Low Quality Mode  
- Toggleable with the 📶 button
- Automatically downgrades to the next lowest quality tier
- Quality tiers: 720p → 480p → 360p → 240p
- Useful for users with limited bandwidth
- Preference persists across sessions

### 4. Player Interface
- Compact player positioned in the top-right corner (desktop) or bottom (mobile)
- Shows current video title and who added it
- Displays the queue with video titles and contributors
- Control buttons for skip, audio-only, and low quality modes
- Automatically shows when entering music room
- Automatically hides when leaving music room

## Technical Implementation

### Server Side (`server.js`)

#### Queue Management
```javascript
const MUSIC_ROOM_QUEUE = {
  queue: [],           // Array of queued videos
  currentVideo: null,  // Currently playing video
  nowPlaying: false    // Playback state
};
```

#### YouTube Link Detection
- Detects various YouTube URL formats:
  - `youtube.com/watch?v=VIDEO_ID`
  - `youtu.be/VIDEO_ID`
  - `youtube.com/shorts/VIDEO_ID`
  - `youtube.com/embed/VIDEO_ID`

#### Socket Events
- `music:play` - Broadcasts new video to all users in music room
- `music:queue` - Updates queue display for all users
- `music:stop` - Stops playback when queue is empty
- `music:next` - Skips to next video
- `music:ended` - Auto-plays next video when current ends
- `music:getState` - Returns current state when user joins room

### Client Side (`public/app.js`)

#### MusicRoomPlayer Module
A self-contained IIFE that manages the music player:
- Initializes YouTube IFrame API
- Creates compact player UI
- Manages user quality preferences via localStorage
- Applies quality settings per-user without affecting others
- Handles video playback and queue display

#### Quality Settings Storage Keys
- `music_audio_only` - Audio-only mode preference
- `music_low_quality` - Low quality mode preference

### Styling (`public/styles.css`)

#### Player Container
- Fixed positioning (top-right on desktop, bottom on mobile)
- Smooth transitions for show/hide
- Compact 360px width to not obstruct chat
- Responsive design for mobile devices

#### Queue Display
- Scrollable list with max height
- Shows position number, video title, and contributor
- Empty state message when queue is empty

## Usage

### For Users

1. **Join the Music Room**
   - Navigate to the music room from the channel list
   - The player will automatically appear

2. **Add Videos**
   - Simply paste any YouTube link in the chat
   - The video will be added to the queue automatically
   - Your message with the link will be replaced by a system message

3. **Control Playback**
   - Use the ⏭ button to skip to the next video
   - Toggle 🎵 for audio-only mode
   - Toggle 📶 for low quality mode

4. **View Queue**
   - The queue section shows all upcoming videos
   - See who added each video
   - Videos play automatically in order

### For Developers

#### Adding to Other Rooms
The implementation is intentionally scoped to the music room only. To add similar functionality to other rooms:

1. Modify the room check in `server.js`:
```javascript
if (room === "music" || room === "your-room-name") {
  // YouTube link detection code
}
```

2. Update the client-side room check in `joinRoom()`:
```javascript
if (room === "music" || room === "your-room-name") {
  // Show player
}
```

#### Customizing Quality Tiers
Edit the `QUALITY_DOWNGRADE` map in `MusicRoomPlayer`:
```javascript
const QUALITY_DOWNGRADE = {
  "hd720": "large",  // Custom mapping
  // ...
};
```

## Security Considerations

1. **XSS Prevention**
   - All user input (video titles, usernames) is escaped using `escapeHtml()`
   - YouTube embeds use `youtube-nocookie.com` for privacy

2. **Rate Limiting**
   - Message rate limiting applies to YouTube links
   - Prevents spam attacks

3. **Input Validation**
   - YouTube links are validated with regex before processing
   - Only valid video IDs are accepted

## Browser Compatibility

- Requires modern browser with ES6 support
- localStorage for preference persistence
- YouTube IFrame API support
- Tested on Chrome, Firefox, Safari, Edge

## Known Limitations

1. Video metadata fetching may fail if noembed.com is unavailable
   - Falls back to "Unknown Video" title
2. Quality changes require video reload (brief interruption)
3. Mobile devices may have autoplay restrictions
4. Maximum queue size is not enforced (could be added if needed)

## Future Enhancements

Potential improvements for future iterations:
- Vote to skip functionality
- Video search/browse interface
- Playlist support
- Volume sync across users
- Timestamp sync for late joiners
- Queue reordering by moderators
- Video duration display
- Playback history
