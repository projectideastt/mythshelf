MythShelf Google Sheet setup

Keep your existing Google Sheet:
https://docs.google.com/spreadsheets/d/1kd9gestpjoV03IBcvCoEbTo93Ybknr-mm7wiQKLl8DI/edit?gid=0#gid=0

To keep the same CSV link, replace the contents of the first tab / gid=0 with books-replacement.csv.
The website reads:
https://docs.google.com/spreadsheets/d/1kd9gestpjoV03IBcvCoEbTo93Ybknr-mm7wiQKLl8DI/export?format=csv&gid=0

Required tabs for Apps Script:
Books
WishShelf
Votes
Newsletter
Suggestions

Newsletter headers:
Timestamp,Email,Name,Source

Votes headers:
Timestamp,BookTitle,Author,VoterName,Reason

Suggestions headers:
Timestamp,BookTitle,Author,Series,Genre,WhySuggestThis,SuggestedBy,Status

WishShelf headers:
BookTitle,Author,Series,Genre,Status,VoteCount,WhyReadIt

After deploying Apps Script:
1. Open assets/script.js
2. Find MYTHSHELF_APP_URL
3. Paste your Web App URL between the quotes
