# Inbox presentation verification

Run the app on http://localhost:3005, then run `node scripts/check-inbox-layout.cjs` from the frontend directory with Playwright available. Set `PLAYWRIGHT_MODULE` to its installed module path if it is outside the project. The default browser channel is `msedge`; override `BROWSER_CHANNEL` if needed.

The check intercepts only its isolated browser's Inbox API requests with synthetic records. It never writes to the database or sends WhatsApp messages. No fixtures are installed in the application.

Checks: 1920x1080, 1440x900 and 1366x768 four-panel desktop layout, no horizontal overflow, no CRM header, filter popover, internal note submission, CRM navigation, and 391px mobile list/chat/details/back flow. PNG captures and the layout report are in this directory.

Production build and targeted ESLint passed after the presentation rebuild. Live provider delivery is outside this visual check.

## Mobile redesign verification

Mobile checks passed at 390x844, 393x873, 412x915, 360x800, and 768x1024. Desktop checks passed at 1366x768, 1440x900, and 1920x1080 with the original panel widths restored. No page exceptions or horizontal overflow were observed. Empty mobile composer: 109px; mobile header: 64px. Filters, customer details/assignment, template sheet access, search clearing, internal notes, CRM navigation and back navigation were exercised with isolated browser fixtures.

Reduced-height viewport checks passed with the composer visible. This simulates keyboard space; a physical mobile OS keyboard has not been tested. Screenshots contain synthetic test data only.

The latest production build was attempted twice and blocked by a connection failure downloading Poppins from Google Fonts. The running development page and browser checks passed. Earlier desktop-build results above predate this mobile change.
