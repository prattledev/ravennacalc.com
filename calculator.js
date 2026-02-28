const HEADER_BYTES = 54; // Ethernet(14) + IPv4(20) + UDP(8) + RTP(12)

function formatBw(bps) {
  if (bps >= 1e9) return { val: (bps / 1e9).toFixed(3), unit: 'Gbps' };
  if (bps >= 1e6) return { val: (bps / 1e6).toFixed(3), unit: 'Mbps' };
  if (bps >= 1e3) return { val: (bps / 1e3).toFixed(2), unit: 'Kbps' };
  return { val: bps.toFixed(0), unit: 'bps' };
}

function altBw(bps) {
  if (bps >= 1e9) return (bps / 1e6).toFixed(1) + ' Mbps';
  if (bps >= 1e6) return (bps / 1e3).toFixed(0) + ' Kbps';
  return '';
}

function fmtBytes(n) {
  if (n >= 1048576) return (n / 1048576).toFixed(2) + ' MB';
  if (n >= 1024) return (n / 1024).toFixed(2) + ' KB';
  return n.toLocaleString('en-US') + ' B';
}

function bwHTML(bps) {
  const f = formatBw(bps);
  return `<span class="bw-val">${f.val}</span><span class="bw-unit">&nbsp;${f.unit}</span>`;
}

function calculate() {
  const channels   = Math.min(256,   Math.max(1, parseInt(document.getElementById('channels').value) || 1));
  const sampleRate = parseInt(document.getElementById('sampleRate').value);
  const bitDepth   = parseInt(document.getElementById('bitDepth').value);
  const packetTime = parseFloat(document.getElementById('packetTime').value);
  const streams    = Math.min(10000, Math.max(1, parseInt(document.getElementById('streams').value) || 1));

  const samplesPerPkt = Math.round(sampleRate * packetTime);
  const payloadBytes  = channels * samplesPerPkt * (bitDepth / 8);
  const pktBytes      = payloadBytes + HEADER_BYTES;
  const pktRate       = 1 / packetTime;
  const bps           = pktBytes * 8 * pktRate;
  const totalBps      = bps * streams;

  document.getElementById('perStreamBw').innerHTML = bwHTML(bps);
  document.getElementById('perStreamBwAlt').textContent = altBw(bps);

  document.getElementById('totalBw').innerHTML = bwHTML(totalBps);
  document.getElementById('totalBwAlt').textContent = altBw(totalBps);

  document.getElementById('totalLabel').textContent =
    streams === 1 ? 'Total (1 stream)' : `Total (${streams.toLocaleString('en-US')} streams)`;

  document.getElementById('packetRate').textContent =
    pktRate.toLocaleString('en-US') + ' pkt/s';
  document.getElementById('samplesPerPkt').textContent =
    samplesPerPkt.toLocaleString('en-US') + ' per ch';
  document.getElementById('payloadSize').textContent = fmtBytes(payloadBytes);
  document.getElementById('packetSize').textContent  = fmtBytes(pktBytes);
}

// Sanitise positive-integer fields
function sanitisePositiveInt(el) {
  const raw = el.value;
  const max = parseInt(el.max) || Infinity;
  const n   = Math.min(max, Math.floor(parseFloat(raw)));
  if (!isFinite(n) || n < 1) {
    el.value = 1;
  } else if (String(n) !== raw.trim()) {
    el.value = n;
  }
}

['channels', 'streams'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('blur', () => {
    sanitisePositiveInt(el);
    calculate();
  });
  el.addEventListener('keydown', e => {
    // Block decimal point, minus, and 'e' (scientific notation)
    if (['.', '-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
  });
});

// Preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.getElementById('channels').value   = this.dataset.channels;
    document.getElementById('streams').value    = '1';
    document.getElementById('sampleRate').value = '48000';
    document.getElementById('bitDepth').value   = '24';
    document.getElementById('packetTime').value = '0.001';
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    calculate();
  });
});

// Deactivate presets on manual change
['channels', 'sampleRate', 'bitDepth', 'packetTime'].forEach(id => {
  ['input', 'change'].forEach(evt => {
    document.getElementById(id).addEventListener(evt, () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      calculate();
    });
  });
});

document.getElementById('streams').addEventListener('input', calculate);
document.getElementById('streams').addEventListener('change', calculate);

calculate();
