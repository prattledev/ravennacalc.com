# ravennacalc.com

A static, single-page bandwidth calculator for RAVENNA / AES67 / SMPTE ST 2110-30 audio-over-IP networks. Hosted on GitHub Pages at [ravennacalc.com](https://ravennacalc.com).

## Features

- Calculate network bandwidth for RAVENNA / AES67 / SMPTE ST 2110-30 audio streams
- Quick presets for common ST 2110-30 channel configurations (2, 4, 8, 16, 64 channels)
- Configurable sample rate (44.1–192 kHz) and bit depth (16/24/32-bit) shared across all groups
- Up to 8 independent stream groups, each with its own channels, streams, and packet time (125 µs–4 ms)
- Per-stream and combined total bandwidth results; per-group packet stats breakdown when using multiple groups
- CSV export of full configuration, per-group results, and packet statistics
- Multicast bandwidth explanation for professional media network design

## Formula

```
samplesPerPacket = round(sampleRate × packetTime)
payloadBytes     = channels × samplesPerPacket × (bitDepth / 8)
packetBytes      = payloadBytes + 54    // 14B Eth + 20B IP + 8B UDP + 12B RTP
bandwidthBps     = packetBytes × 8 × (1 / packetTime)
totalBps         = bandwidthBps × streams
```

## Development

No build tools or dependencies. Open `index.html` directly in a browser.

```
index.html      — markup and page structure
styles.css      — all styles
calculator.js   — all JavaScript
```

## Disclaimer

ravennacalc.com is an independent entity and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with LAWO AG or any of its subsidiaries or affiliates. The name RAVENNA, as well as related names, marks, emblems, and images, are registered trademarks of their respective owners.
