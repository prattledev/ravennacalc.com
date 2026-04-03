# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static, single-page bandwidth calculator for RAVENNA / AES67 / SMPTE ST 2110-30 audio-over-IP networks. Hosted on GitHub Pages at **ravennacalc.com**.

No build tools, package managers, frameworks, or dependencies — everything is plain HTML, CSS, and vanilla JS. Open `index.html` directly in a browser to develop.

## File Structure

- `index.html` — all markup and page structure
- `styles.css` — all styles, linked from the HTML `<head>`
- `calculator.js` — all JavaScript, loaded via `<script src="calculator.js">` at the bottom of `<body>`
- `img/rav_logo.png` — RAVENNA logo displayed in the header, links to ravenna-network.com
- `CNAME` — GitHub Pages custom domain config

## Bandwidth Calculation Formula

```
samplesPerPacket = round(sampleRate × packetTime)
payloadBytes     = channels × samplesPerPacket × (bitDepth / 8)
packetBytes      = payloadBytes + 54          // 54B = Eth(14) + IP(20) + UDP(8) + RTP(12)
bandwidthBps     = packetBytes × 8 × (1 / packetTime)
totalBps         = bandwidthBps × streams
```

## Input Constraints

| Field | Min | Max |
|---|---|---|
| Channels | 1 | 256 |
| Streams | 1 | 10,000 |

Both fields are validated in two places: HTML `min`/`max` attributes and clamping logic inside `calculate()` in `calculator.js`. The `sanitisePositiveInt()` function also enforces these on blur and blocks `.`, `-`, `e` keypresses.

## Colour Scheme

Derived from the RAVENNA logo. CSS custom properties are defined in `:root` in `styles.css`:

- `--header-bg` / `--footer-bg`: `#2c1a08` (dark chocolate brown)
- `--primary`: `#7a8c20` (olive green)
- `--bg`: `#f0ece0` (warm parchment)

## Preset Behaviour

Quick preset buttons (2ch, 4ch, 8ch, 16ch, 64ch) always apply these fixed defaults alongside the channel count: 48 kHz, 24-bit, 1 ms packet time, 1 stream. Manually editing any of channels / sample rate / bit depth / packet time deactivates the active preset highlight.

## Disclaimer

The footer contains a legal disclaimer that ravennacalc.com is independent and unaffiliated with LAWO AG. Do not remove or substantially alter this text.
