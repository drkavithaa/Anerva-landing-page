#!/usr/bin/env node
/* Crop and downscale regions out of a full-page capture, so sections can be
   inspected without re-running the browser. Uses the local PNG toolkit.
   Usage: node tools/crop.mjs <src.png> <y> <h> <out.png> [maxWidth] */
import { decode, crop, resize, encode } from './png.mjs';

const [, , src, y, h, out, maxW = '1100'] = process.argv;
const img = decode(src);
const yy = Math.max(0, Math.min(img.h - 1, Number(y)));
const hh = Math.max(1, Math.min(img.h - yy, Number(h)));
let piece = crop(img, 0, yy, img.w, hh);
const mw = Number(maxW);
if (piece.w > mw) piece = resize(piece, mw, Math.round(piece.h * mw / piece.w));
console.log(out, encode(piece, out), `${piece.w}x${piece.h}`);
