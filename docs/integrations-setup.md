# Live integrations: setup

Every integration a founder connects is real: Kaya verifies the credentials with the vendor's API, stores them encrypted (AES-256-GCM, key in `INTEGRATIONS_ENCRYPTION_KEY`), pulls a 30-day snapshot, and deletes the secret on disconnect. The demo workspace is the only place demo connections exist.

**OAuth redirect URI for every provider:** `https://kaya-zeta.vercel.app/api/integrations/callback`
(add `http://localhost:3000/api/integrations/callback` for local development). If the production domain changes, update `APP_URL` and every app below.

## Works immediately (the founder pastes a key)

| Integration | What the founder creates | Kaya reads / does |
|---|---|---|
| Stripe | Restricted key, read on Customers, Subscriptions, Invoices, Charges, Prices, Products | MRR by currency, active / trialing / past-due subscriptions, 30-day collected revenue |
| Paddle | Billing API key (`pdl_live_apikey_` or `pdl_sdbx_apikey_`), read permissions | MRR, subscriptions, 30-day completed transactions |
| Lemon Squeezy | API key | Stores (selectable), 30-day revenue and sales, active subscriptions |
| PostHog | Personal API key (`phx_`) with `project:read` + `query:read`, US or EU region | Projects (selectable), people and events over 30 days, top events, daily counts for an event |
| Plausible | Stats API key + site domain (+ self-hosted URL) | Visitors, visits, pageviews, bounce rate, duration, top sources |
| Resend | Full-access key + sender on a verified domain | Domains and recent delivery events; sends approved emails with idempotency |
| Brevo | API key (`xkeysib-`) + active sender | 30-day transactional stats, sent campaigns; sends approved emails |
| Creators (Rewardful) | API secret | Campaigns (selectable), affiliates, visitors, leads, conversions; creates affiliates for approved creator deals |

## Needs a Kaya app per provider (one-time, by you)

Set the env vars on Vercel (production + preview) and locally in `.env.local`, then redeploy. Until then the card explains what's missing; nothing is faked.

### Google: Analytics 4, Search Console, Google Ads
1. Google Cloud console → create a project (or reuse the sign-in one) → APIs & Services → enable **Google Analytics Admin API**, **Google Analytics Data API**, **Google Search Console API**, **Google Ads API**.
2. OAuth consent screen → External → add scopes `analytics.readonly`, `webmasters.readonly`, `adwords`. These are sensitive/restricted scopes: submit for verification before going public (test users work immediately).
3. Credentials → OAuth client ID → Web application → redirect URI above.
4. Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (or dedicated `GOOGLE_INTEGRATIONS_CLIENT_ID` / `GOOGLE_INTEGRATIONS_CLIENT_SECRET`).
5. Google Ads only: in a Google Ads **manager** account → Tools → API Center → apply for a developer token → `GOOGLE_ADS_DEVELOPER_TOKEN`. Test-level tokens only reach test accounts; Basic access is needed for real accounts. Optional `GOOGLE_ADS_API_VERSION` (default `v21`).

### Meta Ads
1. developers.facebook.com → Create app → type **Business** → add **Facebook Login for Business** and **Marketing API**.
2. Valid OAuth redirect URI: the URI above.
3. Request `ads_read`, `ads_management`, `business_management` (Advanced access requires App Review and Business Verification; your own ad accounts work in development mode).
4. Env: `META_APP_ID`, `META_APP_SECRET`. Optional `META_GRAPH_VERSION` (default `v23.0`).

### X
1. developer.x.com → Project → App → User authentication settings → OAuth 2.0, type **Web App (confidential client)**, permissions **Read and write**.
2. Callback URI: the URI above.
3. Env: `X_CLIENT_ID`, `X_CLIENT_SECRET`. Reading and posting need an API tier that includes those endpoints.

### LinkedIn
1. linkedin.com/developers → Create app (linked to a company page).
2. Products → add **Sign In with LinkedIn using OpenID Connect** and **Share on LinkedIn**.
3. Auth → authorized redirect URL: the URI above.
4. Env: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`. Optional `LINKEDIN_API_VERSION` (default `202508`). Tokens last 60 days; founders reconnect unless LinkedIn grants refresh tokens to the app.

## What the agent can do with live connections

| Capability | Live providers |
|---|---|
| READ_REVENUE, READ_SUBSCRIPTIONS | Stripe, Paddle, Lemon Squeezy |
| READ_ANALYTICS | Google Analytics 4, PostHog, Plausible |
| READ_PRODUCT_EVENTS | PostHog |
| READ_SEARCH_QUERIES | Search Console (includes queries ranking 9–20) |
| READ_AD_INSIGHTS, PAUSE_CAMPAIGN, UPDATE_AD_BUDGET | Google Ads, Meta Ads (campaigns must be linked by external id) |
| PUBLISH_SOCIAL_POST | X, LinkedIn |
| READ_SOCIAL_ANALYTICS | X |
| READ_EMAIL_METRICS, SEND_EMAIL | Resend, Brevo |
| TRACK_CREATOR_DEALS | Rewardful |

Not live yet, and the agent says so instead of pretending: creating ad campaigns from Kaya (create in the ad platform; Kaya manages budget and pausing), LinkedIn member post analytics (partner-only), LinkedIn Ads, TikTok, HubSpot, Attio, GitHub.
