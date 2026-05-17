# MythShelf

**MythShelf** is a static personal fantasy book review and reading-discovery website.

It uses `books.csv` as a simple spreadsheet-powered database. You can update the site by editing the CSV file directly in GitHub or by exporting from Excel / Google Sheets and replacing `books.csv`.

## Files

```text
index.html
style.css
script.js
books.csv
README.md
```

## What Changed in This Version

This version excludes the bottom Admin section.

For GitHub Pages, the secure admin layer is simply your GitHub account. Only people with access to your repository can change `books.csv`.

## Automatic Book Covers

The site can display covers in two ways:

### 1. Manual cover image

Add an image URL in the `CoverURL` column.

### 2. Automatic cover lookup by ISBN

Leave `CoverURL` blank and add an `ISBN`.

The site will try to load the book cover automatically using the ISBN through Open Library's public cover image service.

Example:

```csv
The Hobbit,J. R. R. Tolkien,9780547928227,,green,Classic Fantasy,4.8,5,5,4,5,5,Legendary Shelf,Reviewed,"quest, dragon, classic, comfort","A foundational fantasy adventure with warmth, danger and wonder.",#
```

If no cover is found, the card may still show a broken external image from the cover service. In that case, use a manual `CoverURL` or remove the `ISBN` and use `CoverStyle`.

## Required CSV Columns

Keep this header row:

```csv
Title,Author,ISBN,CoverURL,CoverStyle,Subgenre,OverallRating,Worldbuilding,Characters,MagicSystem,Pacing,EmotionalImpact,Tier,ReviewStatus,Tags,ShortHook,ReviewLink
```

## CoverStyle Values

Use these if no real cover is available:

```text
red
green
mixed
dark
```

## Tier Values

Recommended tiers:

```text
Legendary Shelf
Crown Worthy
Worthy Quest
Mixed Magic
Not My Realm
Abandoned Quest
Unopened Portal
```

## GitHub Pages Setup

1. Upload these files to your repository root.
2. Go to **Settings** → **Pages**.
3. Select:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /root
4. Save.
5. Your site will be available at:

```text
https://yourusername.github.io/repository-name/
```

## Updating the Books

1. Edit `books.csv`.
2. Commit the change.
3. Refresh your GitHub Pages site.

The code includes a cache-busting request for `books.csv`, so updated data should be fetched more reliably after refresh.

## Suggestion Form

The suggestion form is currently visual only.

To collect real suggestions, connect it to:

- Google Forms
- Formspree
- Netlify Forms
- Tally
- Airtable
- WordPress later

## License Recommendation

Use MIT for the code, but reserve rights for your personal writing and MythShelf branding.

Suggested notice:

```text
Code licensed under the MIT License.

Original writing, reviews, ratings, tier lists, and MythShelf branding are copyright © Ryan Seemungal unless otherwise stated.

Book cover images remain the property of their respective rights holders.
```
