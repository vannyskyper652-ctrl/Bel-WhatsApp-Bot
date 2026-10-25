import makeWASocket, {
useMultiFileAuthState,
DisconnectReason
} from '@whiskeysockets/baileys';

import pino from 'pino';

const PREFIX = '.';
const BOT_NAME = '꧁༒𝕭𝖊𝖑༒꧂';

const commands = {
menu: 'Show available commands',
ping: 'Check bot response speed',
alive: 'Check whether the bot is running',
joke: 'Get a random joke',
quote: 'Get a motivational quote',
truth: 'Get a truth question',
dare: 'Get a dare',
dice: 'Roll a dice',
coin: 'Flip a coin',
ship: 'Calculate a fun compatibility score'
};

const jokes = [
'Why did the phone need glasses? It lost its contacts!',
'I told my Wi-Fi a joke. Nobody connected.',
'Why was the computer cold? It left its Windows open.'
];

const truths = [
'What is your funniest embarrassing moment?',
'Who was your first crush?',
'What is one secret talent you have?'
];

const dares = [
'Send your funniest selfie.',
'Type your next message using only emojis.',
'Give someone in the group a genuine compliment.'
];

const pick = list => list[Math.floor(Math.random() * list.length)];

async function startBot() {
const { state, saveCreds } = await useMultiFileAuthState('./session');

const sock = makeWASocket({
auth: state,
logger: pino({ level: 'silent' }),
browser: [BOT_NAME, 'Chrome', '1.0.0']
});

sock.ev.on('creds.update', saveCreds);

sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
if (connection === 'open') {
console.log("${BOT_NAME} is connected!");
}

if (connection === 'close') {
  const status = lastDisconnect?.error?.output?.statusCode;

  if (status !== DisconnectReason.loggedOut) {
    setTimeout(startBot, 3000);
  } else {
    console.log('Logged out. Reconnect with fresh credentials.');
  }
}

});

sock.ev.on('messages.upsert', async ({ messages, type }) => {
if (type !== 'notify') return;

for (const message of messages) {
  if (!message.message || message.key.fromMe) continue;

  const jid = message.key.remoteJid;
  if (!jid || jid === 'status@broadcast') continue;

  const text = (
    message.message.conversation ||
    message.message.extendedTextMessage?.text ||
    ''
  ).trim();

  if (!text.startsWith(PREFIX)) continue;

  const [command, ...args] = text.slice(PREFIX.length).split(/\s+/);
  const cmd = command.toLowerCase();

  let reply;

  switch (cmd) {
    case 'menu':
    case 'help':
      reply = `${BOT_NAME}\n\n` +
        Object.entries(commands)
          .map(([name, description]) => `.${name} — ${description}`)
          .join('\n');
      break;

    case 'ping':
      reply = 'Pong! 🏓';
      break;

    case 'alive':
      reply = `${BOT_NAME} is online! 💜`;
      break;

    case 'joke':
      reply = pick(jokes);
      break;

    case 'quote':
      reply = pick([
        'Your future needs your focus, not your fear.',
        'Small progress is still progress.',
        'Be consistent, even when nobody is watching.'
      ]);
      break;

    case 'truth':
      reply = pick(truths);
      break;

    case 'dare':
      reply = pick(dares);
      break;

    case 'dice':
      reply = `🎲 You rolled ${1 + Math.floor(Math.random() * 6)}!`;
      break;

    case 'coin':
      reply = `🪙 ${Math.random() < 0.5 ? 'Heads' : 'Tails'}!`;
      break;

    case 'ship': {
      const name = args.join(' ').trim();

      if (!name) {
        reply = 'Usage: .ship Name1 Name2';
      } else {
        const score = Math.floor(Math.random() * 101);
        reply = `💕 Compatibility score: ${score}%\nJust for fun!`;
      }
      break;
    }

    default:
      reply = `Unknown command: ${cmd}\nType .menu to see commands.`;
  }

  if (reply) {
    await sock.sendMessage(jid, { text: reply });
  }
}

});
}

startBot().catch(console.error);
