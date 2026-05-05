---
"@jmndao/mongoose-ai": minor
---

Adopt Changesets for releases. Releases are now published from CI (GitHub Actions) with npm provenance, instead of from developer machines. Contributors describe changes by running `npx changeset` per PR; release notes are published as GitHub Releases. Removes the legacy `release:patch|minor|major` and `changelog` npm scripts and `scripts/changelog.js`.
