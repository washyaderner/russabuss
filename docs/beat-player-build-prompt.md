# Beat Player Build Prompt

> Copy everything below this line and paste it as a prompt when you're ready to build the player.

---

## Task

Build a custom beat player component for my Astro + React site. The player should match my existing design system (dark theme, teal accents `#2dd4bf`, glass morphism effects) and replace the current pricing section.

## Current Site Context

- **Framework:** Astro 5.x with React for interactive components
- **Styling:** Custom CSS with design tokens in `/src/styles/variables.css`
- **Design:** Dark background (#000), teal accent (#2dd4bf), glass morphism (backdrop-blur, semi-transparent borders)
- **Existing components:** See `/src/components/` for styling patterns

## Player Requirements

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                    [License Info ⓘ] │
├─────────────────────────────────────┬───────────────────────────────┤
│                                     │  TRACKLIST                    │
│     ┌─────────────┐                 │  ─────────────────────────    │
│     │             │                 │  ▶ Dark Trap Vibes    140 BPM │
│     │  ALBUM ART  │                 │    Trap • F# Minor            │
│     │   (Logo)    │                 │  ─────────────────────────    │
│     │             │                 │    Midnight Dreams    128 BPM │
│     └─────────────┘                 │    R&B • C Minor              │
│                                     │  ─────────────────────────    │
│     Track Title                     │    Street Heat        145 BPM │
│     Genre • Key • BPM               │    Drill • G Minor            │
│                                     │  ─────────────────────────    │
│  ▶  ════════════════════════  3:24  │    Summer Nights      120 BPM │
│     [waveform visualization]        │    R&B • D Major              │
│                                     │                               │
│  🔊 ━━━━━━━━━━                      │                               │
│                                     │                               │
│         [ Add to Cart ]             │                               │
│                                     │                               │
└─────────────────────────────────────┴───────────────────────────────┘
```

### Left Side (Player)
- **Album art area:** Square, displays my logo (see `/public/` for logo files). The logo should be adapted to use teal tones to match the site theme.
- **Track info:** Title, genre, key, BPM
- **Waveform:** Interactive waveform visualization using Wavesurfer.js, shows progress
- **Controls:** Play/pause button, current time / duration
- **Volume:** Horizontal slider with teal accent
- **Add to Cart:** Teal button, triggers license selection flow

### Right Side (Tracklist)
- Scrollable list of available beats
- Each item shows: title, BPM, genre, key
- Active track highlighted with teal accent/glow
- Click to load that track into the player
- Hover state with subtle glow

### Top Right (License Info)
- Small info icon button
- On hover/click: Popover showing the 4 license tiers with pricing:
  - MP3 ($50) - 320kbps, non-exclusive, 5K copies, 10K streams
  - WAV ($80) - 24-bit 48kHz, 1 edit, 10K copies, 100K streams
  - STEMS ($249) - Track outs, unlimited edits, 20K copies, 250K streams
  - EXCLUSIVE ($2,000) - Full rights, unlimited everything
- Popover should use glass morphism styling

### Add to Cart Flow (For Now)
Since we're not implementing checkout yet, the "Add to Cart" button should:
1. Open a modal with license selection (the 4 tiers as cards)
2. After selecting, show a message: "Coming soon! Contact me directly to purchase this beat."
3. Include a link to the contact section

## Design Specifications

### Colors (from variables.css)
```css
--color-teal: #2dd4bf;
--color-teal-hover: #5eead4;
--color-bg: #000000;
--color-text: #ffffff;
--color-text-secondary: #a0a0a0;
--glass-bg: rgba(255, 255, 255, 0.03);
--glass-border: rgba(255, 255, 255, 0.08);
--glass-hover-bg: rgba(255, 255, 255, 0.05);
--glass-hover-border: rgba(45, 212, 191, 0.3);
```

### Glass Morphism Pattern
```css
.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  backdrop-filter: blur(12px);
}

.glass-card:hover {
  background: var(--glass-hover-bg);
  border-color: var(--glass-hover-border);
}
```

### Teal Glow Effect
```css
.teal-glow {
  box-shadow: 0 0 20px rgba(45, 212, 191, 0.3);
}
```

## Dependencies to Install

```bash
npm install wavesurfer.js @wavesurfer/react
```

## Component Structure

Create these files:

```
/src/components/BeatPlayer/
├── BeatPlayer.jsx        # Main container, state management
├── AlbumArt.jsx          # Logo display area
├── PlayerControls.jsx    # Play/pause, time display
├── Waveform.jsx          # Wavesurfer wrapper
├── VolumeControl.jsx     # Volume slider
├── TrackList.jsx         # Right sidebar with beat list
├── LicensePopover.jsx    # Hover info popover
├── LicenseModal.jsx      # License selection modal
├── AddToCartButton.jsx   # Cart button component
└── BeatPlayer.css        # All styles for the player
```

## Data Structure

For now, use a JSON file for beat data. Create `/src/data/beats.json`:

```json
[
  {
    "id": "1",
    "slug": "dark-trap-vibes",
    "title": "Dark Trap Vibes",
    "bpm": 140,
    "key": "F# Minor",
    "genre": "Trap",
    "duration": 204,
    "previewUrl": "/beats/dark-trap-vibes-preview.mp3"
  },
  {
    "id": "2",
    "slug": "midnight-dreams",
    "title": "Midnight Dreams",
    "bpm": 128,
    "key": "C Minor",
    "genre": "R&B",
    "duration": 195,
    "previewUrl": "/beats/midnight-dreams-preview.mp3"
  }
]
```

Place preview MP3 files in `/public/beats/`.

## Integration

The player should be used in a new Beats section or page. Options:
1. Replace the current PricingSection on the home page
2. Create a new `/beats` page
3. Both - player on home page, full catalog on `/beats`

## Logo Adaptation

My current logo uses a purple-to-teal gradient. For the album art in the player, create an SVG version that:
- Uses only teal tones (#2dd4bf and variations)
- Works on dark background
- Can be placed in `/public/logo-teal.svg`

If you can't modify the logo programmatically, just use the existing logo and I'll update it manually later.

## Responsive Behavior

- **Desktop (>1024px):** Side-by-side layout as shown above
- **Tablet (768-1024px):** Stack tracklist below player
- **Mobile (<768px):** Simplified player, tracklist as expandable accordion

## Accessibility

- Keyboard navigation for play/pause (spacebar)
- ARIA labels on all controls
- Focus states with teal outline
- Screen reader announcements for track changes

## Reference

Look at the existing components for styling patterns:
- `/src/components/PricingSection.astro` - Card layout and glass morphism
- `/src/components/ContactForm.jsx` - React component patterns
- `/src/components/FAQSection.astro` - Interactive expand/collapse
- `/src/styles/variables.css` - All design tokens
- `/src/styles/global.css` - Utility classes and base styles

## Deliverables

1. All component files listed above
2. Beat player CSS file
3. Sample beats.json with placeholder data
4. Integration into the site (either replacing PricingSection or new /beats page)
5. Instructions for adding new beats

## Notes

- The e-commerce/checkout integration is documented separately in `/docs/beat-store-infrastructure.md` - don't implement that yet
- For now, "Add to Cart" should just show license info and a "coming soon" message with contact link
- Prioritize smooth playback and visual polish over features
- The waveform should be the hero visual element - make it look professional

---

> End of prompt. When ready to build, paste everything above to Claude.
