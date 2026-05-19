<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project rules

WashLog is a hackathon project for mobile-first laundry tracking. Keep changes scoped to the shortest user path: register clothing, check last washed state, record wear, record laundry completion.

When editing documents, remove duplicated sections first and keep the first screen focused on judgment, request, evidence, and next action. Store raw team PRDs under `docs/prd/raw/` and put only agreed decisions into product documents.

For database work, default to Supabase Postgres unless a PRD requirement clearly needs another option. Do not commit `.env` files, Supabase keys, tokens, or personal sample data.
