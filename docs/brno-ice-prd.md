# Product Requirements Document: Brno Reservoir Ice Skating Status Page

## Overview
A minimal, clean web page that displays real-time ice skating conditions for Brno Reservoir (Brněnská přehrada / Prygl) by scraping data from prygl.net. The page uses vibrant background colors to immediately communicate safety status and includes playful, informative messaging.

## Core Functionality

### Data Source
- Primary source: https://www.prygl.net/
- Scrapes ice thickness data from "Stav ledu na přehradě" section
- Updates: Automatic refresh twice daily (matching source update frequency)

### Status States

#### 1. Ready for Skating (GREEN)
- **Trigger**: Ice thickness meets official safety guidelines from prygl.net authorities
- **Background**: Vibrant green (#00C853 or similar saturated green)
- **Text color**: Black or white (WCAG compliant contrast)

#### 2. Not Ready for Skating (RED)
- **Trigger**: Ice thickness below official safety threshold OR warnings present
- **Background**: Vibrant red (#FF1744 or similar saturated red)
- **Text color**: Black or white (WCAG compliant contrast)

#### 3. No Data / Off-Season (NEUTRAL)
- **Trigger**: No ice data available, summer months, or stale data
- **Background**: Neutral gray or seasonal color
- **Text color**: WCAG compliant
- **Messaging**: Season-aware humorous messages (examples below)

### Content Display

#### Page Title
- Small, unobtrusive identifier: "Brno Reservoir Skating Conditions" or similar
- Positioned at top or as subtle header

#### Main Status Message (Primary Element)
**Ready State Examples (with emoji):**
- "⛸️ Let's go skating! The ice is ready"
- "❄️ Perfect conditions - the Prygl is frozen solid!"
- "🎉 Good news! Skating is available"
- "✨ Ice is ready - grab your skates!"

**Not Ready State Examples (with emoji):**
- "🚫 Not today, friend - the ice is too thin"
- "⚠️ Hold up - ice isn't safe yet"
- "❌ Not quite ready - the ice needs more time"
- "🧊 Too thin to skate - stay off the ice!"

**Off-Season/No Data Examples (with emoji):**
- "☀️ No ice available in Brno right now, only inside your fridge. Grab a cold drink and come back during winter."
- "🌸 Spring has arrived! The ice is long gone. See you next winter for skating!"
- "🏖️ It's summer - think swimming, not skating. Check back in December!"
- "🍂 Autumn leaves are falling, but no ice yet. Come back when winter arrives!"

#### Detailed Information Section
**Always display (when data available):**
- Measurement date: "Data z měření ledu městskou policií dne: [DATE]"
- Ice thickness: "Tloušťka ledu: [RANGE] cm"
- Full detailed message from source including:
  - Individual location measurements (přístav Bystrc, Kozí horka, Sokol, Rokle, etc.)
  - All warnings (methane bubbles, ice cracking, water level changes, etc.)
  - Additional reservoir info (Žebětínský rybník, Medlánecký, etc.)
  - Safety disclaimer: "Vstup na zamrzlou hladinu přehrady je vždy jen na vlastní nebezpečí!"

**When no data available:**
- Show fields as "—" or "Not available"

### Language Support
- **Czech (CS)**: Default language, displays source text as-is
- **English (EN)**: Translated version of all content
- Toggle button/link to switch between languages
- Language preference remembered (localStorage or cookie)

### Design Specifications

#### Typography
- **Font**: Helvetica (with fallbacks: Helvetica Neue, Arial, sans-serif)
- **Main status message**: Very large, bold (e.g., 48-72px on desktop, responsive scaling)
- **Details section**: Medium size, readable (e.g., 18-24px on desktop)
- **Page title**: Small, subtle (e.g., 14-16px)

#### Layout
- Minimal, clean design
- No unnecessary elements (no nav bars, footers with links, ads, etc.)
- Center-aligned content
- Generous white space around elements
- Responsive design for mobile/tablet/desktop

#### Colors
- **Backgrounds**: Vibrant, saturated colors
  - Green: e.g., #00C853, #00E676
  - Red: e.g., #FF1744, #F44336
  - Neutral/Off-season: e.g., #78909C, #90A4AE
- **Text**: Black (#000000) or White (#FFFFFF)
- **Contrast**: Must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)

### Technical Requirements

#### Scraping
- Server-side scraping (not client-side to avoid CORS issues)
- Parse ice thickness data from prygl.net homepage
- Extract: date, thickness range, detailed measurements, warnings
- Handle encoding (source uses windows-1250)
- Error handling for failed scrapes or missing data

#### Auto-Refresh
- Refresh data twice per day automatically
- Suggested times: Morning (e.g., 8:00 AM) and afternoon (e.g., 4:00 PM)
- Display "last updated" timestamp
- Optional: Allow manual refresh button

#### Status Logic
- Determine green/red based on official safety guidelines from prygl.net
- If warnings present (methane bubbles, cracking, etc.) → RED state regardless of thickness
- If no recent data (>7 days old?) → OFF-SEASON state

#### Season Detection
- Detect current season based on date
- Winter: December-March (potential ice)
- Spring: April-May
- Summer: June-August
- Autumn: September-November
- Use appropriate off-season messaging

### Content Strategy

#### Message Rotation
- Rotate between 3-4 different messages for each state
- Prevents monotony for repeat visitors
- Random selection on each page load/refresh

#### Czech Source Text
- Display original Czech text from prygl.net as-is
- Preserve formatting, line breaks
- Include all safety warnings verbatim

#### English Translation
- Translate main status messages
- Translate measurement labels and warnings
- Keep location names in Czech (přístav Bystrc, etc.) but add context
- Translate safety disclaimer

### Accessibility
- WCAG 2.1 AA compliance
- High contrast text/background
- Semantic HTML
- Screen reader friendly
- Keyboard navigation support
- Clear focus indicators

### Performance
- Fast page load (<2 seconds)
- Minimal JavaScript
- Optimized for mobile data connections
- Cache scraped data appropriately

## User Flows

### Primary Flow: Check Skating Conditions
1. User visits page
2. Immediately sees vibrant background color (green/red/neutral)
3. Reads large, playful status message with emoji
4. Scrolls to see detailed ice measurements and warnings
5. Switches language if needed (CS/EN toggle)

### Secondary Flow: No Data Available
1. User visits during off-season
2. Sees neutral background with humorous seasonal message
3. Sees "—" in data fields
4. Understands to check back during winter

## Success Metrics
- Clear, immediate understanding of skating safety (binary status)
- All relevant data from source displayed accurately
- Fast, responsive page load
- High contrast, readable design
- Proper Czech character encoding
- Accurate translations

## Out of Scope
- Historical ice data / charts
- User accounts or personalization
- Social sharing features
- Comments or community features
- Weather forecasts beyond what's on source
- Mobile app (web only)
- Push notifications

## Future Enhancements (V2+)
- SMS/email alerts when ice becomes safe
- Historical thickness trends
- Weather integration
- Direct link to prygl.net source
- Multiple reservoir support
