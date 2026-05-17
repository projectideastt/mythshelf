# MythShelf

MythShelf is a static public-facing fantasy reading journal.

This version uses a simplified rating model:

- `PublicRating` for Goodreads / reader / public ratings entered manually.
- `MythShelfScore` for the personal endorsement score out of 5.
- `Tier` for the experience-based reading tier.

## Google Sheet Headers

```csv
Title,Author,ISBN,CoverURL,CoverStyle,Series,Subgenre,PublicRating,MythShelfScore,Tier,ReviewStatus,ReadingFormat,ReadingProgress,Tags,ShortHook,ReviewLink
```

## Live Data Source

```text
https://docs.google.com/spreadsheets/d/1kd9gestpjoV03IBcvCoEbTo93Ybknr-mm7wiQKLl8DI/export?format=csv&gid=0
```

## Files

```text
index.html
style.css
script.js
books.csv
README.md
```

`books.csv` is included as a backup/sample. The live site is set to read from the Google Sheet in `script.js`.

## License

Code may be licensed under MIT.

Original writing, reviews, ratings, tier lists and MythShelf branding are copyright © Ryan Seemungal unless otherwise stated.

Book cover images remain the property of their respective rights holders.
