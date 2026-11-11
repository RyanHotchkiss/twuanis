<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Twuanis production deployment synchronization

Use `/Users/cassidydaddy/twuanis` as the authoritative editable Twuanis source for all production work. An isolated candidate may be used only when it is derived from this project and its exact changes are tracked.

A Twuanis production deployment is complete only after all of the following are recorded in the same task:

1. Deploy the intended candidate through the existing Vercel CLI process.
2. Confirm the Vercel deployment is `Ready` and serves both `twuanis.com` and `www.twuanis.com`.
3. Commit the exact deployed application source to `production-baseline/2026-11-11-mobile-topbar` and push it to `https://github.com/RyanHotchkiss/twuanis.git`, excluding secrets, dependencies, build output, and local Vercel linkage.
4. Synchronize `/Users/cassidydaddy/twuanis` with that exact commit without destructive resets or overwriting unrelated local work.
5. Verify the primary project, deployed candidate, and GitHub branch resolve to the same commit SHA; record that SHA with the Vercel deployment ID.

The Vercel CLI deployment does not supply a native Git SHA. Preserve the association by committing the exact candidate before deployment, deploying from that committed candidate, and recording the deployment ID and commit SHA together. Do not claim alignment from a clean working tree alone.

If any synchronization step fails, report the exact failure and leave production intact. Do not create automatic GitHub-triggered production deployments.
