# Chat Notification Features Implementation

## Overview

Added notification sound and unread message indicator functionality to the Chat component.

## Features Implemented

### 1. Notification Sound on Message Receipt ✅

- **Trigger**: Plays when receiving a message from support (not when sending)
- **Implementation**:
  - Uses `expo-av` Audio API
  - Configured to play in iOS silent mode
  - Volume set to 80% (0.8)
  - Sound file: `assets/notification.mp3` (needs to be added)
  - Graceful error handling if sound file missing

**Code Location**: `components/Chat.js` lines ~134-160

```javascript
const playNotificationSound = async () => {
  // Plays notification.mp3 when support messages arrive
  // Includes error handling with helpful console messages
};
```

### 2. Unread Message Indicator ✅

- **Trigger**: Shown when user navigates away from chat with unread support messages
- **Implementation**:
  - New state: `hasUnreadMessages` (boolean)
  - New prop: `onUnreadChange` callback to notify parent component
  - Tracks unread status based on message read state
  - Automatically clears when chat becomes visible
  - Updates parent component via callback

**Code Location**: `components/Chat.js` lines ~560-580

```javascript
useEffect(() => {
  // Monitors visibility and message read status
  // Calls onUnreadChange(true/false) to notify parent
}, [visible, messages, userType, hasUnreadMessages, onUnreadChange]);
```

## How It Works

### Message Flow

1. User receives message from support via WebSocket
2. Message is added to local state
3. If sender is "support", `playNotificationSound()` is called
4. Sound plays (or logs error if file missing)
5. If chat is not visible, unread indicator is triggered
6. Parent component is notified via `onUnreadChange(true)`

### Unread Tracking Logic

- **When chat is visible**: Unread count is cleared, parent notified with `false`
- **When chat is hidden**: System checks for unread support messages
  - If unread messages exist: `hasUnreadMessages = true`, parent notified with `true`
  - If no unread messages: `hasUnreadMessages = false`, parent notified with `false`

### Parent Component Integration

The parent component that renders `<Chat>` needs to:

1. Add a handler for unread changes:

```javascript
const [hasUnreadChat, setHasUnreadChat] = useState(false);

const handleChatUnreadChange = (hasUnread) => {
  setHasUnreadChat(hasUnread);
  // Update UI to show unread indicator (badge, dot, etc.)
};
```

2. Pass the handler to Chat component:

```javascript
<Chat
  visible={chatVisible}
  onClose={handleChatClose}
  userId={userId}
  userName={userName}
  userType={userType}
  chatType={chatType}
  onUnreadChange={handleChatUnreadChange} // <-- New prop
/>
```

3. Display unread indicator in UI:

```javascript
{
  hasUnreadChat && (
    <View style={styles.unreadBadge}>
      <Text style={styles.unreadText}>•</Text>
    </View>
  );
}
```

## Dependencies Added

- `expo-av`: ^14.0.7 (for audio playback)

## Files Modified

1. `components/Chat.js`:
   - Added Audio import from expo-av
   - Added `soundRef` useRef
   - Added `hasUnreadMessages` state
   - Added `onUnreadChange` prop
   - Added `playNotificationSound()` function
   - Added Audio setup in useEffect
   - Added unread tracking effect
   - Modified message handler to call playNotificationSound()

## Files Created

1. `assets/NOTIFICATION_SOUND_NEEDED.md` - Instructions for adding sound file

## Next Steps

### Required: Add Notification Sound

1. Download or create a notification sound (0.5-2 seconds, MP3 format)
2. Save as `assets/notification.mp3`
3. Sound will automatically play when receiving messages

**Sound Resources**:

- Freesound.org (search "notification ding")
- Zapsplat.com
- Mixkit.co

### Optional: Add Haptic Feedback

If you prefer vibration over sound:

```bash
npx expo install expo-haptics
```

Then uncomment the haptics code in the error handler.

### Parent Component Updates

Update the parent component (e.g., `RealtorHome.js`, `ClientHome.js`) to:

1. Add state for tracking unread messages
2. Pass `onUnreadChange` prop to Chat
3. Display unread indicator (badge/dot) when `hasUnread` is true

## Testing Checklist

- [ ] Add notification.mp3 to assets folder
- [ ] Test receiving message when chat is visible (should play sound)
- [ ] Test receiving message when on another page (should play sound + set unread)
- [ ] Test opening chat with unread messages (should clear unread)
- [ ] Test that sent messages don't trigger sound
- [ ] Test on iOS with silent mode (sound should still play)
- [ ] Verify parent component receives unread callbacks

## Technical Notes

- Sound plays for ALL received support messages, regardless of visibility
- Unread indicator only shows when chat is NOT visible
- Sound file is loaded on-demand (not pre-cached)
- Audio mode configured for iOS silent mode playback
- Graceful fallback if sound file missing (console warnings only)
