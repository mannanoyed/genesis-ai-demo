# Genesis AI Showroom Assistant
### Sales Brief — BANAO Technologies
---

## What We Built

A voice-powered AI concierge deployed as a kiosk/tablet application for Genesis showrooms across the UAE. Customers walk up, speak naturally, and get instant expert answers about any Genesis vehicle — in English or Arabic. The AI captures leads in the background without ever feeling like a sales tool.

This is a **fully working demo**, not a mockup. Everything shown is live and functional.

---

## The Problem It Solves

| Situation | Without This | With Genesis AI |
|---|---|---|
| Customer walks in casually | Sales staff may be busy or miss them | AI engages instantly, every time |
| Customer asks a technical question | Staff may not know exact specs | Instant accurate answer from knowledge base |
| Customer speaks Arabic | Limited Arabic-fluent staff | Responds fluently in Arabic automatically |
| Customer shows interest but leaves | Lead lost | Contact captured naturally in conversation |
| Peak hours / multiple customers | Staff stretched thin | Unlimited parallel conversations |

---

## What the Demo Covers

### The Interface
Three connected screens optimised for tablet/kiosk (landscape):

1. **Welcome Screen** — Genesis branding, ambient animation, two entry points: browse vehicles or talk to AI directly
2. **Vehicle Selector** — All 9 Genesis models in a filterable grid (Sedans / SUVs / Electric). One tap opens full specs
3. **Spec Board** — Full vehicle detail page with 6 tabbed sections: Performance, Dimensions, Interior, Safety, Wheels, Pricing. "Ask Genesis AI" button always available

### The Voice Chatbot
- Tap the mic button and speak — AI listens, responds, speaks back
- Animated orb visualiser changes state: idle / listening / thinking / speaking
- Full conversation transcript on screen
- Text input fallback if mic is unavailable
- Auto-listen mode: AI speaks, then immediately listens for the next question
- Space bar push-to-talk shortcut

### Language
- English/Arabic toggle top-right of every screen
- If a customer speaks Arabic mid-conversation, the AI detects and switches automatically
- All responses, UI labels and lead forms adapt to the selected language

---

## The 7 Scenarios It Handles

These are the exact scenarios Genesis/Innocean care about — all tested and working:

**1. The Casual Browser**
> "I'm just looking around"

AI doesn't push. Warm welcome, open question about preferences, starts building rapport naturally.

**2. The V8 Question**
> "Why doesn't Genesis have a V8?"

AI gives an educated, brand-positive answer: the 3.5L Twin-Turbo V6 delivers up to 409 HP — comparable to most V8s — while meeting global emissions standards. Positions Genesis's electrification roadmap as forward-thinking, not a compromise.

**3. The Family Buyer**
> "I need something for my family, I have 3 kids"

AI recommends the GV80 with 3-row seating (up to 7 seats), highlights captain chairs in the 6-seat configuration, air suspension, and safety suite. Naturally mentions the GV70 as an alternative for smaller families.

**4. The Performance Seeker**
> "I want the most powerful car you have"

AI walks through options by category: G70 3.3T for sport sedan purists, GV60 Performance at 483 HP boost mode for EV performance, G90 for flagship power with comfort. Asks what kind of driving they do to narrow down.

**5. The Competitor Comparison**
> "How does the GV80 compare to the Mercedes GLE?"

AI acknowledges the GLE respectfully, then highlights Genesis advantages: more standard features at a lower price point, 5-year unlimited km warranty (vs Mercedes' 2-year), higher safety ratings, and a fresher design language. Never dismissive.

**6. The High-Intent Customer**
> Customer asks about pricing, financing, availability

AI detects rising intent via the profiling system, naturally moves toward: "Would you like to experience the GV80 firsthand? I can arrange a test drive for you today."

**7. The Arabic Speaker**
> "عندكم سيارات كهربائية؟" (Do you have electric vehicles?)

AI responds fully in Arabic, covers the GV60, Electrified G80, and Electrified GV70 — range, charging times, pricing in AED.

---

## The Intelligence Layer (What's Happening Behind the Scenes)

### Real-Time Customer Profiling
Every conversation builds a live customer profile, visible in a toggleable sidebar:

- **Intent Level:** Browsing → Comparing → High Interest → Ready to Buy
- **Vehicle Preferences:** Which models came up in conversation
- **Key Priorities:** Performance / Comfort / Family / Electric / Value / Luxury
- **Budget Indicator:** Entry / Mid / Flagship tier
- **Lead Score:** Cold / Warm / Hot (colour coded)
- **Recommended Next Action:** Engage / Show Specs / Offer Test Drive / Capture Lead

This gives showroom staff immediate context if they take over the conversation.

### Lead Capture
After 3–4 exchanges, the AI naturally says:
> "I'd love to send you a personalized comparison — may I have your name and email?"

An inline form appears in the chat (no popup, no interruption). Name, email, UAE phone (+971 prefix). Stored instantly to a database with the full conversation context, vehicle interest, intent score and priorities attached.

### Knowledge Base (RAG)
The AI does not hallucinate specs. All answers are grounded in a vector database seeded with:
- Full specs for all 9 Genesis vehicles (performance, dimensions, interior, safety, wheels, pricing)
- Brand FAQ (warranty, showroom locations, V8 question, competitor positioning)
- If it genuinely doesn't know something: "Let me connect you with our Genesis specialist for that detail"

---

## The 9 Vehicles Covered

| Model | Type | Starting Price (AED) |
|---|---|---|
| G70 | Compact Sport Sedan | 165,000 |
| G80 | Mid-Size Executive Sedan | 235,000 |
| G90 | Flagship Luxury Sedan | 380,000 |
| GV60 | Compact Electric SUV | 250,000 |
| GV70 | Compact Luxury SUV | 210,000 |
| GV80 | Mid-Size Luxury SUV (up to 7 seats) | 265,000 |
| GV80 Coupe | Luxury Coupe SUV | 310,000 |
| Electrified G80 | Electric Executive Sedan | 330,000 |
| Electrified GV70 | Electric Compact SUV | 290,000 |

---

## What Makes This Different from a Standard Chatbot

| Standard Chatbot | Genesis AI |
|---|---|
| Text only | Voice-first with animated visual feedback |
| Generic responses | Grounded in Genesis-specific knowledge base — no hallucinations |
| One language | English + Arabic, auto-detected |
| No customer insight | Real-time profiling and lead scoring |
| Popup lead forms | Inline, conversational lead capture |
| Widget bolted onto a page | Full kiosk experience designed for the showroom floor |
| Responds the same to everyone | Adapts tone and recommendations to each customer's signals |

---

## What Comes Next (Scope for Full Engagement)

The demo is intentionally scoped as a proof of concept. A production deployment would include:

- **CRM Integration** — Leads pushed directly to Genesis's CRM (Salesforce, HubSpot, etc.)
- **Analytics Dashboard** — Daily lead reports, top questions, conversion funnel by vehicle
- **Test Drive Booking** — In-conversation scheduling connected to showroom calendar
- **Multi-Location Support** — Dubai, Abu Dhabi, Sharjah with location-aware responses
- **Vehicle Configurator Integration** — Live pricing based on selected options
- **Hardened Arabic NLP** — Dialect-aware responses (Gulf Arabic vs. MSA)
- **Staff Handoff** — AI flags hot leads to a nearby staff member in real time
- **Custom ElevenLabs Voice** — A branded Genesis AI voice, not a generic TTS voice

---

## Built By

**BANAO Technologies**
AI Solutions — Dubai, UAE

This demo was designed, built and deployed end-to-end by BANAO. All components are production-ready and extensible. The system is live and accessible — no screen share needed, the client can use it directly from their phone or browser.
