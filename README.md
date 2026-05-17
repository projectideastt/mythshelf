# MythShelf

MythShelf is a static personal fantasy book review and tier-list website.

It is designed for GitHub Pages, Netlify, Cloudflare Pages, or any other static web host.

## Files

```text
index.html
style.css
script.js
books.csv
README.md
```

## How it works

The website reads `books.csv` and automatically builds:

- the book cover gallery
- search and filters
- statistics
- personal tier list
- rating cards

## How to update the shelf

1. Edit your book list in Excel or Google Sheets.
2. Export/download it as CSV.
3. Rename the file exactly:

```text
books.csv
```

4. Replace the existing `books.csv` in the repository root.
5. Commit the change.
6. Refresh the website.

## Required CSV columns

Keep the header row exactly like this:

```csv
Title,Author,CoverURL,CoverStyle,Subgenre,OverallRating,Worldbuilding,Characters,MagicSystem,Pacing,EmotionalImpact,Tier,ReviewStatus,Tags,ShortHook,ReviewLink
```

## CoverStyle values

Use one of:

```text
red
green
mixed
dark
```

If `CoverURL` is provided, the site will use the image instead of a gradient cover.

## Tier values

Recommended values:

```text
Legendary Shelf
Crown Worthy
Worthy Quest
Mixed Magic
Not My Realm
Abandoned Quest
Unopened Portal
```

## ReviewStatus examples

```text
Reviewed
TBR
Currently Reading
Suggested
DNF
```

## GitHub Pages setup

1. Create a new GitHub repository named `mythshelf`.
2. Upload all files in this folder.
3. Go to **Settings** → **Pages**.
4. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/root**
5. Save.
6. Your site will appear at something like:

```text
https://yourusername.github.io/mythshelf/
```

## Suggestion form

The suggestion form is currently a front-end demo.

To collect real submissions, connect it to one of these:

- Google Forms
- Formspree
- Netlify Forms
- Airtable
- WordPress form plugin

## Admin note

For GitHub Pages, the secure admin layer is your GitHub account.

Do not use a JavaScript password for a real public admin system.
Only people with repository access should be able to update `books.csv`.
