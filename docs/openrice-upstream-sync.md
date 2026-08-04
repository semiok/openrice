# OpenRice upstream sync

OpenRice is an independent fork of OpenLoomi. Upstream changes are imported
through a reviewed sync pull request; they are never shipped directly to
OpenRice users. The full release gate is documented in
[`openrice-release-process.md`](./openrice-release-process.md).

## Compatibility boundary

Keep these identifiers unchanged unless there is a separately planned migration:

- plugin and command IDs containing `openloomi`
- workspace package scope `@openloomi/*`
- environment variables beginning with `OPENLOOMI_`
- browser and desktop events beginning with `openloomi:`
- user data under `~/.openloomi`
- the existing `openloomi-ctl` executable name

These names are implementation compatibility, not product branding. User-facing
copy, icons, links, application metadata, updater endpoints, and plugin display
fields use OpenRice.

## One-time remote setup

The canonical upstream remote is `https://github.com/melandlabs/openloomi.git`.
Confirm it before every sync, and add it if a fresh clone only has `origin`:

```bash
git remote get-url upstream || \
  git remote add upstream https://github.com/melandlabs/openloomi.git
git remote -v
```

Adding this fetch-only source does not publish OpenRice changes upstream.

## Select an upstream baseline

Use an OpenLoomi release tag by default. Do not merge `upstream/main` merely
because it is newer: it may contain unreleased migrations, incomplete features,
or changes that have not passed an upstream release cycle.

```bash
git fetch origin main
git fetch upstream --tags
git tag --list --sort=-version:refname 'v*' | head
git show --no-patch --decorate <UPSTREAM_TAG>
git log --oneline <PREVIOUS_UPSTREAM_TAG>..<UPSTREAM_TAG>
```

Record the following in the Linear issue and sync PR:

- upstream release URL, tag, and commit SHA
- previous upstream tag already incorporated into OpenRice
- OpenRice `main` commit used as the branch base
- release notes and any database, configuration, runtime, permission, or
  packaging changes
- why a non-release commit is needed, if an emergency fix is cherry-picked

## Sync procedure

Start from the latest OpenRice `main`. Use the active Linear issue identifier and
the maintainer prefix for the branch name; do not reuse an old feature branch.

```bash
git switch main
git pull --ff-only origin main
git switch -c m5/MET-XX-sync-openloomi-<VERSION>
git merge --no-ff <UPSTREAM_TAG>
```

Resolve functional conflicts first, then restore the OpenRice overlay:

```bash
pnpm brand:apply
pnpm brand:check
pnpm tsc
pnpm test
pnpm build
```

Never resolve a branding conflict by accepting the complete upstream version of
a branded file. The CI brand check catches known display regressions, but it does
not replace the manual desktop acceptance checks in the release process.

## Sync PR requirements

The sync PR must:

- target `main` and remain unmerged until review and CI pass
- be authored or explicitly signed in the PR body by the responsible maintainer
  (for M5 work, include `Maintainer: M5`)
- link the Linear release issue
- include the upstream and OpenRice SHAs
- summarize resolved conflicts and OpenRice-only changes that were reapplied
- include the automated results and the manual desktop test matrix
- identify any deferred upstream change, migration risk, or release blocker

Merging the sync PR only makes the code eligible for an OpenRice release. It does
not authorize tagging or publishing. Continue with
[`openrice-release-process.md`](./openrice-release-process.md).
