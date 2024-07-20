# Trello2Obsidian

Convert your trello boards to Obsidian Kanban boards. Compatible with Obsidian Kanban Plugin.

## How to Use

### Export Trello board as JSON

1. Go to your trello board
2. Select `...` menu on the top right
3. Select `Print, export, and share`
4. Select `Export as JSON`
5. Download or copy the JSON data to `<trello-board>.json`

### Export Attachments

1. Generate API key by following the steps [Managing your API Key](https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/#managing-your-api-key) and [Authentication and Authorization](https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/#authentication-and-authorization).

> You only need to do this if you want to download attachments from your cards.

### Run the script

```
export TRELLO_API_KEY=<your-trello-app-api-key>
export TRELLO_TOKEN=<your-trello-token>
node trello.mjs "trello-board.json"
```