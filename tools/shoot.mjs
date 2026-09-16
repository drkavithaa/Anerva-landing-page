#!/usr/bin/env node
/* Reliable screenshots via headless Chrome.
   The in-app browser pane returns stale/blank frames on this machine, so every
   visual check goes through here instead. Chrome needs ABSOLUTE Windows paths.
   Usage: node tools/shoot.mjs <w> <h> <name> [url] [--nojs] [--delay=ms] [--scroll=px] */
import { execFileSync } from 'child_process';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = 'C:/Users/mamuj/AppData/Local/Temp/claude/chromeprof';
const [, , w = '1440', h = '900', name = 'shot', url0 = 'http://127.0.0.1:8777/index.html', ...flags] = process.argv;

const nojs = flags.includes('--nojs');
const delay = (flags.find(f => f.startsWith('--delay=')) || '--delay=6500').split('=')[1];
const scroll = (flags.find(f => f.startsWith('--scroll=')) || '--scroll=0').split('=')[1];

// carried in the query so it survives the headless load
const to = (flags.find(f => f.startsWith('--to=')) || '').split('=')[1];
let url = url0;
if (to) url += (url.includes('?') ? '&' : '?') + 'y=0&to=' + to;
else if (scroll !== '0') url += (url.includes('?') ? '&' : '?') + 'y=' + scroll;

const out = resolve('shots', name.endsWith('.png') ? name : name + '.png');
mkdirSync(resolve('shots'), { recursive: true });

const args = [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--window-size=${w},${h}`,
  `--virtual-time-budget=${delay}`,
  '--autoplay-policy=no-user-gesture-required',
  '--no-sandbox', '--disable-dev-shm-usage',
  `--user-data-dir=${PROFILE}`,
  `--screenshot=${out.replace(/\//g, '\\')}`,
];
if (nojs) args.push('--disable-javascript');
args.push(url);

try {
  const r = execFileSync(CHROME, args, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
  process.stdout.write(r.toString());
} catch (e) {
  process.stdout.write((e.stdout || '').toString() + (e.stderr || '').toString());
}
console.log(out);
