# Audio Files for bugabsurd-blog

## Glitch Sound Effect

The blog now uses **Web Audio API** to generate glitch sounds programmatically, which means:
- ✅ **No external files needed** - works immediately
- ✅ **Always available** - no missing audio files
- ✅ **Customizable** - can be modified in the code
- ✅ **Lightweight** - no file downloads

## Current Implementation

The glitch sound is generated using:
- **Oscillator**: Sawtooth wave with frequency modulation
- **Filter**: High-pass filter for glitch effect
- **Duration**: 0.3 seconds
- **Volume**: Automatically controlled envelope

## Customization Options

### Option 1: Modify the Generated Sound
Edit the audio parameters in `pages/index.js`:
- Change `oscillator.type` (sine, square, sawtooth, triangle)
- Adjust frequency ranges
- Modify duration
- Change filter settings

### Option 2: Use External Audio File
If you prefer a custom audio file:

1. Place your audio file in this directory
2. Update the code in `pages/index.js` to use:
   ```javascript
   const audio = new Audio('/audio/your-sound.mp3');
   audio.volume = 0.3;
   audio.play();
   ```

### Recommended External Audio Specifications:
- **Format**: MP3, WAV, or OGG
- **Duration**: 0.3-0.5 seconds
- **Type**: Glitch/static/electronic noise
- **Volume**: Normalized (code will set volume to 30%)

### Where to find glitch sounds:
1. **Free sound libraries**: Freesound.org, Zapsplat
2. **Creative Commons**: ccMixter, Internet Archive
3. **Sound effect generators**: Online glitch generators
4. **Create your own**: Using audio software like Audacity

The sound will play when users click on post links to enhance the cyberpunk/surrealist experience. 