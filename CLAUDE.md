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

Applied per stream group. The combined total is the sum of all groups' `groupBps`.

```
samplesPerPacket = round(sampleRate × packetTime)
payloadBytes     = channels × samplesPerPacket × (bitDepth / 8)
packetBytes      = payloadBytes + 54          // 54B = Eth(14) + IP(20) + UDP(8) + RTP(12)
bandwidthBps     = packetBytes × 8 × (1 / packetTime)
groupBps         = bandwidthBps × streams
```

Each group uses its own `packetTime` value; `sampleRate` and `bitDepth` are global.

## Input Constraints

| Field | Min | Max |
|---|---|---|
| Channels | 1 | 256 |
| Streams | 1 | 10,000 |
| Stream Groups | 1 | 8 |

Channels and streams are validated in two places: HTML `min`/`max` attributes and clamping logic inside `calculate()` in `calculator.js`. The `sanitisePositiveInt()` function also enforces these on `focusout` and blocks `.`, `-`, `e` keypresses.

## Stream Groups

Users can add up to 8 independent stream groups, each with its own Channels, Streams, and Packet Time inputs. Sample Rate and Bit Depth are **global** (shared across all groups). Group rows are created and removed dynamically via `createRow()`, `addRow()`, and `removeRow()` in `calculator.js` — there is no group markup baked into `index.html`. Event listeners on group inputs use **event delegation** on `#streamGroups` (using `focusout` rather than `blur` since `blur` does not bubble).

- When 1 group: results card left block shows "Per Stream" bandwidth; stats grid shows 4 tiles (packet rate, samples/packet, payload size, packet size)
- When 2+ groups: left block shows a "Breakdown" list (per-group totals); right block shows "Combined Total (N groups)"; stats grid switches to a per-group table showing all four packet statistics for each group

## Colour Scheme

Derived from the RAVENNA logo. CSS custom properties are defined in `:root` in `styles.css`:

- `--header-bg` / `--footer-bg`: `#2c1a08` (dark chocolate brown)
- `--primary`: `#7a8c20` (olive green)
- `--bg`: `#f0ece0` (warm parchment)

## Preset Behaviour

Quick preset buttons (2ch, 4ch, 8ch, 16ch, 64ch) always apply these fixed defaults alongside the channel count: 48 kHz, 24-bit, 1 ms packet time, 1 stream. Clicking a preset also **removes all extra stream groups**, resetting to a single Group 1. Manually editing channels, sample rate, bit depth, or the group's packet time deactivates the active preset highlight. Editing streams does not deactivate the preset.

## CSV Export

The "Export CSV" button in the results card downloads `ravenna-bandwidth.csv` containing the full configuration, per-group bandwidth breakdown, combined total, and packet statistics. The `exportCSV()` function in `calculator.js` re-reads all inputs at export time (it does not cache state).

## Disclaimer

The footer contains a legal disclaimer that ravennacalc.com is independent and unaffiliated with LAWO AG. Do not remove or substantially alter this text.
