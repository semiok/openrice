# OpenRice upstream sync

OpenRice is an independent fork of OpenLoomi. Product branding is maintained as
a small overlay so upstream functionality can continue to be merged without
renaming internal protocols or moving existing user data.

## Compatibility boundary

Keep these identifiers unchanged unless there is a separately planned migration:

- plugin and command IDs containing `openloomi`
- workspace package scope `@openloomi/*`
- environment variables beginning with `OPENLOOMI_`
- browser and desktop events beginning with `openloomi:`
- user data under `~/.openloomi`
- the existing `openloomi-ctl` executable name

These names are implementation compatibility, not product branding. User-facing
copy, icons, links, application metadata, and plugin display fields use OpenRice.

## Sync procedure

```bash
git fetch upstream
git switch -c sync/openloomi-YYYYMMDD main
git merge --no-ff upstream/main
pnpm brand:apply
pnpm brand:check
pnpm tsc
pnpm build
```

Resolve functional conflicts first, then run `brand:apply`. Never resolve a
branding conflict by accepting the complete upstream version of a branded file.
The CI brand check blocks a pull request if an upstream merge restores known
OpenLoomi display copy or replaces canonical OpenRice assets.

The upstream remote remains `https://github.com/melandlabs/openloomi`. This is
intentional and does not expose OpenRice changes to upstream unless a contributor
explicitly opens a pull request there.
