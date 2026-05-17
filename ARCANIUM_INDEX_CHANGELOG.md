# Arcanium Index rebrand package

This package adapts the existing MythShelf codebase into **Arcanium Index** while preserving the current GitHub Pages structure and backend setup.

## What changed

- Visible site brand changed to **Arcanium Index**.
- Main tagline changed to **Where books become worlds.**
- Navigation labels changed:
  - `Full Shelf` → `The Index`
  - `Recommends` → `Reading Paths`
  - `Wish Shelf` → `Wish Vault`
  - `Writing` remains `Writing`
  - `Newsletter` remains `Newsletter`
- About page rewritten around the Arcanium Index concept.
- Existing filenames are preserved so GitHub links do not break:
  - `shelf.html`
  - `recommends.html`
  - `wish-shelf.html`
  - `writing.html`
- Existing Google Apps Script URL and sheet tab logic are preserved.
- Existing logo asset filenames are preserved:
  - `assets/mythicshelf-01.png`
  - `assets/mythicshelf-01.ico`

## Important

Do not rename the Google Sheet columns yet. The code still expects columns such as `MythShelfScore` in `books.csv`. The public-facing label has been changed to `Index Score` where relevant.

## Upload instructions

Upload/extract all files in this package into the root of the GitHub Pages repository and commit.

Then hard-refresh the site after GitHub Pages updates:

- Windows/Linux: `Ctrl + F5`
- Add `?v=2` to the site URL if caching persists.
