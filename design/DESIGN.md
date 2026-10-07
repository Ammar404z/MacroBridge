# MacroBridge design handoff

Dark, gym-oriented look ("Instrument"): graphite ground, one lime accent, calorie ring as the hero.
The screens in `screens/` are static HTML mockups with inline styles. Open them in a browser to see them; read the inline styles for exact values. They are a visual spec, not code to copy in as-is.

All names, foods, meals and numbers in the mockups are placeholder data.

## How to use this

1. Add the tokens below to `frontend/src/index.css` and load Manrope.
2. Build the shared pieces first: `TabBar`, `PrimaryButton`, `Pill`, `Field`, `MealSegment`, `Card`, `CalorieRing`, `MacroTile`.
3. Restyle the existing pages (Login, Signup, Dashboard, LogMeal), then add the new ones.
4. Mockups are fixed at 390 x 844. The real app should be fluid: full width on phones, `max-w-lg` centred on larger screens.

## Tokens

Tailwind v4 theme for `frontend/src/index.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: "Manrope", "Avenir Next", system-ui, sans-serif;
  --color-bg: #0F1214;        /* page ground */
  --color-surface: #171C1F;   /* cards, inputs, rows */
  --color-surface-2: #22282C; /* pills, ring track, avatars */
  --color-line: #2A3136;      /* borders, bar tracks */
  --color-ink: #F2F5F3;       /* primary text */
  --color-ink-2: #C9D0D4;     /* field labels, secondary actions */
  --color-muted: #A3ACB3;     /* captions, inactive tabs */
  --color-accent: #C8F25C;    /* ring, primary button, active tab */
  --color-on-accent: #10140A; /* text on accent */
  --color-bar: #DCE2DF;       /* macro bar fill */
  --color-danger: #FF8A7A;    /* destructive text */
}

body {
  @apply bg-bg text-ink antialiased;
}
```

Font: Manrope, weights 400, 500, 600, 700 (Google Fonts). Use `font-variant-numeric: tabular-nums` on every number.

| Role | Size / weight |
|---|---|
| Page title | 20px / 700, letter-spacing -0.02em |
| Ring number | 42px / 700, letter-spacing -0.03em |
| Servings number | 56px / 700 |
| Tile and stat numbers | 20 to 22px / 700 |
| Section heading | 14px / 700 |
| Row title | 14px / 600 |
| Field label | 13px / 600, ink-2 |
| Caption | 12 to 13px, muted |
| Tab label | 11px / 600 (700 when active) |

| Element | Value |
|---|---|
| Screen padding | 20px sides, 16px top |
| Card radius | 14px |
| Input radius, segment radius | 12px |
| Primary button | 52px tall, fully rounded, accent fill, on-accent text, 16px / 700 |
| Pill button ("Log", "Log this", "Add") | 44px tall, fully rounded, surface-2 fill or accent outline, accent text, 13px / 700 |
| Input | 48px tall, surface fill, 1px line border, 16px text |
| List row | 56 to 64px tall, surface fill, 8px gap between rows |
| Minimum touch target | 44px |

## Components

- **TabBar**: 5 slots: Today, Foods, centre Log button (52px accent circle with a plus), Friends, Profile. 64px of content plus the bottom safe area (`env(safe-area-inset-bottom)`; the mockup uses 20px). 1px top border in `line`. Active tab is accent, inactive is muted. Shown on Today, Foods, Friends, Friend profile and Profile. Hidden on Login and on focused flows (Log a meal, Check the estimate, Meal ideas, Log a food, Edit food), which have a back arrow instead.
- **CalorieRing**: SVG, two circles. Track stroke `surface-2`, progress stroke `accent`, round caps, rotated -90 degrees. `stroke-dasharray = (eaten / target) * 2πr, 2πr`. Today: 180px box, r 78, stroke 12. Centre shows kcal left. If over target, show "X over" and cap the arc at 100%.
- **MacroTile**: surface card, label, `value / target g`, 4px bar. Bars are neutral (`bar`), not coloured per macro; the accent is reserved for calories and actions.
- **MealSegment**: 4 equal buttons (Breakfast, Lunch, Dinner, Snack), 44px tall. Selected is accent fill with on-accent text.
- **Icons**: inline stroke SVG, 1.6 to 2.2 stroke width, `currentColor`. No emoji.

## Screens

| File | Route | Backend |
|---|---|---|
| `Login.html` | `/login` (Signup uses the same layout) | `POST /api/auth/login`, `POST /api/auth/register` |
| `Today.html` | `/` | `GET /api/meals/today`, `DELETE /api/meals/{id}` |
| `LogMeal.html` | `/log` | `POST /api/meals/analyze` |
| `LogResult.html` | `/log`, after analyze | `POST /api/meals/log`; "Also save to my foods" adds `POST /api/foods` |
| `Suggest.html` | `/suggest` | `POST /api/meals/suggest`; "Log this" calls `POST /api/meals/log` |
| `Foods.html` | `/foods` | `GET /api/foods` |
| `FoodLog.html` | `/foods/:id/log` | `POST /api/foods/{id}/log` |
| `FoodEdit.html` | `/foods/:id` and `/foods/new` (same screen, empty, no Delete) | `POST`, `PUT`, `DELETE /api/foods` |
| `Profile.html` | `/profile` | `GET`, `PUT /api/profile`; Log out lives here now |
| `Friends.html` | `/friends` | `GET /api/friends`, accept/decline, invite link share |
| `FriendProfile.html` | `/friends/:id` | `GET /api/friends/{id}`, `DELETE` to unfriend |
| `AppIcon.html` | PWA icon source, 512 x 512 | none |

Navigation: Meal ideas is opened from the "Meal ideas for what's left" row on Today. "Pick from my foods" on Log a meal goes to My foods. Tapping a food row opens Edit food; its "Log" pill opens Log a food.

## Built since the handoff (not in the mockups)

These follow the same tokens and components:

- Signup (Login layout plus name and daily targets), the "Enter macros" manual state, empty, loading and error states.
- `/invite/:code`: the page a friend's invite link opens (logged-out visitors sign up or log in first, then return to it).
- `/meals/:id`: Edit meal (tap a meal on Today), including moving it to another day.
- `/profile/password`: Change password. Profile also has the picture, the "Friends can see my meals" switch, and a logout confirmation.
- Today: ‹ › arrows for past days, and "Add a meal to this day" in place of Meal ideas on past days.
- Friends tab: a lime badge with the number of incoming requests.

Decisions taken on the open points: friendships are mutual (request via invite link, then accept); friends see the whole day as mocked; sharing is on by default; the Friend profile button reads "Friends ✓" and removes the friend after a confirmation; Meal ideas are three single meals.
