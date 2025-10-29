# Notification Sound Required

The chat component needs a notification sound file to play when messages are received.

## Required File

- **Filename**: `notification.mp3`
- **Location**: `assets/notification.mp3`
- **Format**: MP3 audio file
- **Recommended Duration**: 0.5-2 seconds
- **Recommended Volume**: Medium (normalized)

## Where to Get Sound Files

### Option 1: Free Sound Libraries

- **Freesound.org**: https://freesound.org (search for "notification", "ding", "ping")
- **Zapsplat**: https://www.zapsplat.com/sound-effect-category/notifications/
- **Mixkit**: https://mixkit.co/free-sound-effects/notification/

### Option 2: Create Custom Sound

- Use online tools like:
  - **Chirp**: https://chirp.audio/
  - **Bfxr**: https://www.bfxr.net/
  - **Audio Tool**: https://www.audiotool.com/

### Option 3: Use System Sounds

- Extract from your device's notification sounds
- Convert to MP3 format if needed

## Implementation

Once you add `notification.mp3` to the assets folder:

1. The sound will automatically play when you receive a message
2. Sound plays even when device is in silent mode (iOS)
3. Volume is set to 80% (0.8) by default

## Alternative: Use Haptic Feedback

If you don't want sound, you can use vibration instead:

```bash
npx expo install expo-haptics
```

Then in Chat.js, uncomment the haptics code in the catch block of `playNotificationSound()`.
