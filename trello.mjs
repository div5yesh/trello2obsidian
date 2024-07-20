// node trello.mjs "trello-board.json"

import fs from 'fs';

// escape card names to remove [/':] since file names with these characters are not supported
function escapeCardName(name) {
  return name.replaceAll("/", " or ").replaceAll("'", "").replaceAll(": ", " - ");
}

function createFrontmatter({ card, comments, attachments, hasChecklist }) {
  return `---
date: ${card.dateLastActivity}
tags: 
- card 
${card.labels.map(label => `- ${label.name}`).join('\n')}
link: ${card.url} 
${card.due ? `\ndue: ${card.due}` : ''}
${hasChecklist ? `progress: '\`$= const tasks = dv.page(\"${escapeCardName(card.name)}\").file.tasks; dv.span(tasks.filter(t => t.completed).length + "/" + tasks.length);\`'` : ''}
---
# ${escapeCardName(card.name)}
${hasChecklist ? `\`\`\`dataview
LIST without ID
	"<progress value='" + (length(filter(this.file.tasks.completed, (t) => t = true)) / length(this.file.tasks)) * 100 + "' max='100'></progress>" + "<br>" + round((length(filter(this.file.tasks.completed, (t) => t = true)) / length(this.file.tasks)) * 100) + "% completed"
FROM "trello2obsidian"
LIMIT 1
\`\`\`` : ''}
${attachments.map(attachment => `![[${attachment.name}]]\n`)}
${card.desc}
${comments.join('\n')}
`;
}

function createChecklist(checklist) {
  let title = `## ${checklist.name}`;
  const tasks = checklist.checkItems.map(item => `- [${item.state == 'complete' ? 'x' : ' '}] ${item.name}`);
  return `${title}\n${tasks.join('\n')}`;
}

function createBoard({ name, lanes }) {
  const boardFrontmatter = `---

kanban-plugin: board

---

`;

  const boardFooter = `

%% kanban:settings
\`\`\`
{"kanban-plugin":"board","list-collapse":[${lanes.map(() => "false").join(",")}]}
\`\`\`
%%
`;

  return {
    name,
    content: boardFrontmatter + lanes.join('\n') + boardFooter
  };
}

function createLanes({ lists, cards }) {
  return lists
    .filter(list => !list.closed)
    .map(list => {
      const laneCards = cards
        .filter(card => card.idList == list.id && !card.closed)
        .map(card => `- [ ] [[${escapeCardName(card.name)}]]`);

      return `## ${list.name}\n\n${laneCards.join('\n')}`;
    });
}

function createNotes({ cards, checklists }) {
  return cards
    .filter(card => !card.closed)
    .map((card) => {
      const notes = checklists
        .filter(checklist => checklist.idCard === card.id)
        .map(createChecklist);

      const comments = getComments({ actions, card });
      const attachments = card.attachments.filter(attachment => !!attachment.url);
      process.env.TRELLO_API_KEY && process.env.TRELLO_TOKEN && attachments.map(getAttachment);
      const frontmatter = createFrontmatter({ card, comments, attachments, hasChecklist: notes.length > 0 });

      return {
        name: card.name,
        content: frontmatter + notes.join('\n')
      };
    });
}

function getComments({ actions, card }) {
  return actions
    .filter(action => action.type === 'commentCard' && action.data.card.id === card.id)
    .map(action => `💬 ${action.data.text}`);
}

function writeToFiles(files) {
  files.forEach(({ name, content }) => {
    fs.writeFile(`${escapeCardName(name)}.md`, content, (err) => {
      if (err) throw err;
      console.log(`[${name}] written successfully!`);
    });
  });
};

function readFile(fileName) {
  const jsonData = fs.readFileSync(fileName, 'utf8');
  return JSON.parse(jsonData);
}

async function getAttachment({ url, name }) {
  const apiKey = process.env.TRELLO_API_KEY
  const apiToken = process.env.TRELLO_TOKEN
  const response = await fetch(url, {
    headers: {
      'Authorization': `OAuth oauth_consumer_key="${apiKey}", oauth_token="${apiToken}"`
    }
  });

  const buffer = await response.arrayBuffer();
  fs.writeFile(name, Buffer.from(buffer), (err) => {
    if (err) throw err;
    console.log(`[${name}] written successfully!`);
  });
}

const args = process.argv.slice(2);
const { name, cards, checklists, actions, lists } = readFile(args[0]);

const lanes = createLanes({ lists, cards });
const notes = createNotes({ cards, checklists });
const board = [createBoard({ name, lanes })];

writeToFiles(board);
writeToFiles(notes);
