# OpenRice upstream and desktop release process

- **Policy owner:** M5
- **Tracking issue:** [MET-36](https://linear.app/metasnowsky/issue/MET-36/openrice-上游同步与桌面-release-发布门禁)
- **Importance:** P0 product release control

This runbook controls how an OpenLoomi release becomes an OpenRice desktop
release. OpenLoomi is an input, not the distribution channel. No upstream commit,
tag, installer, or release asset is sent directly to OpenRice users.

```text
OpenLoomi release
  -> scoped upstream sync PR
  -> OpenRice brand and compatibility gates
  -> merged OpenRice main
  -> signed, unpublished RC artifacts
  -> install and upgrade acceptance
  -> OpenRice v* tag
  -> semiok/openrice GitHub Release
  -> OpenRice desktop update prompt
```

## Roles and approval

One person may perform several roles, but the evidence for every role must be in
the Linear issue or PR.

| Role           | Responsibility                                                                         |
| -------------- | -------------------------------------------------------------------------------------- |
| Intake owner   | Selects the upstream release and records the exact provenance.                         |
| Sync owner     | Creates the isolated branch, resolves conflicts, and restores the OpenRice overlay.    |
| Reviewer       | Confirms functional changes, brand compatibility, and test evidence before merging.    |
| Release owner  | Builds the RC, performs upgrade acceptance, and decides whether the tag may be pushed. |
| Rollback owner | Keeps the previous installer and data snapshot available until the release is stable.  |

For M5-owned releases, commits and PR/release notes must contain `Maintainer: M5`.
No PR is merged and no tag is pushed merely because the build succeeded.

## Gate 0: release intake

Default to a published OpenLoomi release tag, not `upstream/main`. Follow
[`openrice-upstream-sync.md`](./openrice-upstream-sync.md) to configure the remote,
inspect the delta, and create the sync PR.

Before coding, add an intake comment to the Linear issue with:

- upstream Release URL, tag, and immutable commit SHA
- current OpenRice `main` SHA and current production OpenRice version
- affected product areas and migrations
- known security notes and dependency changes
- expected OpenRice version and rollback owner

**Pass:** the upstream source and OpenRice base are immutable and reviewable.

**Fail:** the proposed source is only a moving branch, an unreviewed installer, or
an unknown commit.

## Gate 1: sync PR and automated checks

Run the repository checks after resolving upstream conflicts and applying the
brand overlay:

```bash
pnpm brand:apply
pnpm brand:check
pnpm tsc
pnpm test
pnpm build
```

For updater or packaging changes, also run the focused Rust tests:

```bash
cargo test --manifest-path apps/web/src-tauri/Cargo.toml update::tests
```

Confirm that every version source agrees before the RC build:

- `package.json`
- `apps/web/package.json`
- `apps/web/src-tauri/Cargo.toml`
- `apps/web/src-tauri/tauri.conf.json`
- `apps/web/src-tauri/tauri.conf.dev.json`

The target version must be greater than the currently published OpenRice version
and must match the future tag without its `v` prefix.

**Pass:** CI is green, the exact version is consistent, and the PR records test
results and conflict decisions.

**Fail:** any required check is skipped, flaky, or explained away without an
explicit release-owner waiver.

## Gate 2: OpenRice brand and compatibility acceptance

Automated brand checking is necessary but not sufficient. Install or run the RC
as a desktop application and verify the following matrix.

### Product brand

- application name, dock/menu title, icons, onboarding, notifications, dialogs,
  errors, links, and Help/About surfaces say OpenRice
- bundle identifier is `ai.traditionow.openrice`
- GitHub, download, update, support, and issue links intentionally point to
  OpenRice-owned destinations; upstream links are labeled as upstream references
- the updater requests only `semiok/openrice/releases/latest`
- plugins presented to the user display OpenRice

### Compatibility identifiers

The following remain unchanged unless the release contains an approved migration:

- `@openloomi/*` package names and plugin/command IDs
- `OPENLOOMI_*` environment variables and `openloomi:` events
- `~/.openloomi` user-data location
- `openloomi-ctl` executable and compatible CLI contracts

### User state

Create representative state on the previous production version, then upgrade the
same installation to the RC and confirm:

- existing chats and workspace history open correctly
- Memory data remains readable and new entries can be created
- installed Skills, enabled state, and favorite Skills remain intact
- connectors retain configuration or clearly request reauthorization
- Codex remains selected, its configured executable is found after restart, and a
  real chat request completes
- desktop permissions and system-locale calls do not produce permission errors
- the app can be quit, restarted, and launched from `/Applications`

**Pass:** every applicable row has evidence (screenshot, log, or reviewer note).

**Fail:** any OpenLoomi end-user branding leaks unexpectedly, the updater points
upstream, or existing user state is lost or silently reset.

## Gate 3: build and accept a release candidate

After the sync PR is reviewed and merged, run the `Release CI` workflow manually
with `workflow_dispatch` and `commit_sha` set to the exact OpenRice `main` commit.
This path builds downloadable artifacts but intentionally skips `create-release`.

Download the artifacts from that workflow run and verify at minimum:

- macOS Apple Silicon and Intel DMG names and architectures
- Developer ID signature and Apple notarization/stapling
- the bundled `openloomi-ctl` executable is present and functional
- clean install on a machine without OpenRice
- in-place upgrade from the previous production release
- `openloomi-ctl update --check --json` returns the expected current state
- failed/cancelled installation leaves the previous app launchable

The release asset contract is fixed because the desktop updater selects exact
filenames:

```text
openrice_<VERSION>_macOS_aarch64.dmg
openrice_<VERSION>_macOS_amd64.dmg
openrice_<VERSION>_linux_amd64.deb
openrice_<VERSION>_linux_amd64.rpm
openrice_<VERSION>_linux_aarch64.deb
openrice_<VERSION>_linux_aarch64.rpm
openrice_<VERSION>_windows_amd64.exe
```

Record SHA-256 values for accepted RC assets. A checksum published in release
notes helps humans audit assets, but does not replace in-app verification.

**Pass:** the exact commit and all accepted artifacts are recorded in MET-36 (or
its successor release issue).

**Fail:** an artifact is unsigned, has the wrong architecture/name, or was built
from a different commit.

## Gate 4: backup and rollback rehearsal

Keep the previous production installers until the new release has completed its
stability window. Before an upgrade acceptance test:

1. Quit OpenRice.
2. Copy `~/.openloomi` to a dated test-only snapshot in a protected location.
3. Preserve the previous signed application or installer.
4. Run the RC upgrade and verify the user-state matrix.
5. Reinstall the previous application and restore the test snapshot to prove the
   documented rollback works.

The updater's optional backup currently preserves the installed application
bundle; it is not a complete backup of `~/.openloomi`. Do not describe it as a
full user-data rollback.

**Pass:** both forward upgrade and rollback have been exercised on disposable or
approved test data.

**Fail:** rollback relies on an untested assumption or modifies the only copy of
real user data.

## Gate 5: publish the OpenRice release

Pushing a `v*` tag triggers `.github/workflows/release.yml`, builds all platforms,
and publishes a non-draft GitHub Release. Treat the tag push as the final release
approval, not as an RC experiment.

Before pushing the tag:

- confirm the tagged commit is the accepted `main` commit
- confirm all version files equal `<VERSION>`
- prepare release notes from the template below
- obtain reviewer and release-owner approval in the Linear issue
- confirm Apple signing/notarization secrets and GitHub Actions are available
- confirm no open P0/P1 regression is deferred without written approval

```bash
git switch main
git pull --ff-only origin main
test "$(git rev-parse HEAD)" = "<ACCEPTED_COMMIT_SHA>"
git tag -s v<VERSION> -m "OpenRice v<VERSION>"
git push origin v<VERSION>
```

If signed tags are not yet supported by the maintainer environment, stop and
record an explicit waiver before using an annotated tag. Never move or overwrite
a published release tag.

### Release notes template

```markdown
## OpenRice v<VERSION>

Maintainer: M5

- OpenRice commit: `<SHA>`
- Upstream OpenLoomi release: `<URL / TAG / SHA>`
- Previous OpenRice release: `<VERSION>`

### OpenRice changes

### Brand and compatibility validation

### Upgrade and rollback validation

### Checksums

### Known issues
```

After the workflow publishes, verify that `releases/latest` resolves to the new
version and every expected asset exists. Correct the generated notes immediately
so they include the required provenance and acceptance evidence.

## Gate 6: desktop update verification

Use a machine still running the previous OpenRice version:

1. Start OpenRice and wait for the automatic update check.
2. Confirm the banner reports the OpenRice version and release URL.
3. Download, install, and restart from the banner with backup enabled.
4. Confirm the application version and repeat the user-state smoke tests.
5. Run `openloomi-ctl update --check --json` and confirm no newer update remains.

Keep the Linear release issue open through the stability window. Record update
success/failure, crash reports, and rollback decisions there.

## Stop-ship conditions

Do not push the release tag, or remove the release from `latest` if already
published, when any of these conditions is true:

- unexpected OpenLoomi user-facing branding or upstream download/update links
- incorrect bundle ID, version, signature, notarization, or asset filename
- loss/corruption of chats, Memory, Skills, favorites, connectors, or Codex setup
- updater selects an asset from any repository other than `semiok/openrice`
- no tested rollback path
- a P0/P1 regression lacks written product-owner acceptance

Deleting or replacing a published tag is not the rollback mechanism. Prefer a
new fixed version and, when necessary, mark the bad GitHub Release as a
prerelease or remove it from `latest` while preserving the audit trail.

## Known automation gaps

These gaps must remain visible until follow-up issues close them:

1. The desktop updater downloads assets over HTTPS but does not yet validate a
   published SHA-256 or cryptographic signature before installation.
2. The tag workflow publishes a non-draft Release immediately after successful
   builds; it has no separate environment approval between build and publication.
3. Generated GitHub release notes do not enforce the provenance and rollback
   template in this document.
4. The updater backup covers the application bundle, not the user-data directory.

Until automated, the release owner must record the corresponding manual evidence
and waiver in the Linear release issue. Security/integrity gaps may not be waived
for broad external rollout without explicit product-owner approval.
