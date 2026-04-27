const HEADER_BYTES = 54; // Ethernet(14) + IPv4(20) + UDP(8) + RTP(12)
const MAX_GROUPS   = 8;

let forcedUnit = null; // null = auto, 'Mbps', or 'Gbps'

function formatBw(bps) {
  if (forcedUnit === 'Gbps') return { val: (bps / 1e9).toFixed(3), unit: 'Gbps' };
  if (forcedUnit === 'Mbps') return { val: (bps / 1e6).toFixed(3), unit: 'Mbps' };
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

// ── Row management ────────────────────────────────────────────────────────────

function createRow() {
  const row = document.createElement('div');
  row.className = 'stream-row';

  const label = document.createElement('div');
  const num   = document.createElement('span');
  num.className = 'stream-row-number';
  num.textContent = 'Group 1';
  label.appendChild(num);

  const inputs = document.createElement('div');
  inputs.className = 'stream-row-inputs';

  function makeField(labelText, cls, defaultVal, min, max, hint) {
    const field = document.createElement('div');
    field.className = 'form-field';
    const lbl = document.createElement('label');
    lbl.className = 'form-label';
    lbl.textContent = labelText;
    const inp = document.createElement('input');
    inp.className = `form-input ${cls}`;
    inp.type  = 'number';
    inp.value = defaultVal;
    inp.min   = min;
    inp.max   = max;
    inp.step  = '1';
    const h = document.createElement('span');
    h.className = 'field-hint';
    h.textContent = hint;
    field.appendChild(lbl);
    field.appendChild(inp);
    field.appendChild(h);
    return field;
  }

  inputs.appendChild(makeField('Channels', 'row-channels', 2, 1, 256, 'Max 256'));
  inputs.appendChild(makeField('Streams',  'row-streams',  1, 1, 10000, 'Max 10,000'));

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-row-btn remove-row-btn--hidden';
  removeBtn.type = 'button';
  removeBtn.setAttribute('aria-label', 'Remove group');
  removeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  row.appendChild(label);
  row.appendChild(inputs);
  row.appendChild(removeBtn);
  return row;
}

function renumberRows() {
  document.querySelectorAll('.stream-row').forEach((row, i) => {
    row.querySelector('.stream-row-number').textContent = `Group ${i + 1}`;
  });
}

function updateAddButton() {
  const btn   = document.getElementById('addGroupBtn');
  const count = document.querySelectorAll('.stream-row').length;
  btn.disabled = count >= MAX_GROUPS;
  btn.classList.toggle('add-group-btn--disabled', count >= MAX_GROUPS);
}

function updateRemoveButtons() {
  const rows   = document.querySelectorAll('.stream-row');
  const single = rows.length === 1;
  rows.forEach(row => {
    row.querySelector('.remove-row-btn').classList.toggle('remove-row-btn--hidden', single);
  });
}

function addRow() {
  const rows = document.querySelectorAll('.stream-row');
  if (rows.length >= MAX_GROUPS) return;
  const row = createRow();
  document.getElementById('streamGroups').appendChild(row);
  renumberRows();
  updateRemoveButtons();
  updateAddButton();
  calculate();
  row.querySelector('.row-channels').focus();
}

function removeRow(rowEl) {
  if (document.querySelectorAll('.stream-row').length <= 1) return;
  rowEl.remove();
  renumberRows();
  updateRemoveButtons();
  updateAddButton();
  calculate();
}

// ── Calculation ───────────────────────────────────────────────────────────────

function renderBreakdown(groupResults) {
  const list = document.getElementById('breakdownList');
  list.innerHTML = '';
  groupResults.forEach((g, i) => {
    const item   = document.createElement('div');
    item.className = 'breakdown-item';
    const detail = g.streams === 1 ? `${g.channels}ch` : `${g.channels}ch × ${g.streams.toLocaleString('en-US')}`;
    item.innerHTML =
      `<span class="breakdown-grp">Grp ${i + 1}</span>` +
      `<span class="breakdown-detail">${detail}</span>` +
      `<span class="breakdown-bw">${bwHTML(g.groupBps)}</span>`;
    list.appendChild(item);
  });
}

function calculate() {
  const sampleRate = parseInt(document.getElementById('sampleRate').value);
  const bitDepth   = parseInt(document.getElementById('bitDepth').value);
  const packetTime = parseFloat(document.getElementById('packetTime').value);

  const samplesPerPkt = Math.round(sampleRate * packetTime);
  const pktRate       = 1 / packetTime;

  const rows = document.querySelectorAll('.stream-row');
  let totalBps = 0;
  const groupResults = [];

  rows.forEach(row => {
    const channels = Math.min(256,   Math.max(1, parseInt(row.querySelector('.row-channels').value) || 1));
    const streams  = Math.min(10000, Math.max(1, parseInt(row.querySelector('.row-streams').value)  || 1));
    const payloadBytes = channels * samplesPerPkt * (bitDepth / 8);
    const pktBytes     = payloadBytes + HEADER_BYTES;
    const bps          = pktBytes * 8 * pktRate;
    const groupBps     = bps * streams;
    totalBps += groupBps;
    groupResults.push({ channels, streams, bps, groupBps, payloadBytes, pktBytes });
  });

  const perStreamView = document.getElementById('perStreamView');
  const breakdownView = document.getElementById('breakdownView');

  if (rows.length === 1) {
    perStreamView.hidden = false;
    breakdownView.hidden = true;
    document.getElementById('perStreamBw').innerHTML      = bwHTML(groupResults[0].bps);
    document.getElementById('perStreamBwAlt').textContent = altBw(groupResults[0].bps);
  } else {
    perStreamView.hidden = true;
    breakdownView.hidden = false;
    renderBreakdown(groupResults);
  }

  document.getElementById('totalBw').innerHTML      = bwHTML(totalBps);
  document.getElementById('totalBwAlt').textContent = altBw(totalBps);

  if (rows.length === 1) {
    const s = groupResults[0].streams;
    document.getElementById('totalLabel').textContent =
      s === 1 ? 'Total (1 stream)' : `Total (${s.toLocaleString('en-US')} streams)`;
  } else {
    document.getElementById('totalLabel').textContent = `Total (${rows.length} groups)`;
  }

  // Stats grid — packet rate and samples/pkt are global; payload/packet size from Group 1
  document.getElementById('packetRate').textContent    = pktRate.toLocaleString('en-US') + ' pkt/s';
  document.getElementById('samplesPerPkt').textContent = samplesPerPkt.toLocaleString('en-US') + ' per ch';
  document.getElementById('payloadSize').textContent   = fmtBytes(groupResults[0].payloadBytes);
  document.getElementById('packetSize').textContent    = fmtBytes(groupResults[0].pktBytes);
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

// ── Event delegation on stream groups ────────────────────────────────────────

const streamGroupsEl = document.getElementById('streamGroups');

streamGroupsEl.addEventListener('input', e => {
  if (e.target.matches('.row-channels')) {
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  }
  if (e.target.matches('.row-channels, .row-streams')) calculate();
});

streamGroupsEl.addEventListener('change', e => {
  if (e.target.matches('.row-channels, .row-streams')) calculate();
});

streamGroupsEl.addEventListener('focusout', e => {
  if (e.target.matches('.row-channels, .row-streams')) {
    sanitisePositiveInt(e.target);
    calculate();
  }
});

streamGroupsEl.addEventListener('keydown', e => {
  if (e.target.matches('.row-channels, .row-streams')) {
    if (['.', '-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
  }
});

streamGroupsEl.addEventListener('click', e => {
  const btn = e.target.closest('.remove-row-btn');
  if (btn) removeRow(btn.closest('.stream-row'));
});

document.getElementById('addGroupBtn').addEventListener('click', addRow);

// ── Preset buttons ────────────────────────────────────────────────────────────

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const rows = document.querySelectorAll('.stream-row');
    rows.forEach((row, i) => { if (i > 0) row.remove(); });

    const firstRow = document.querySelector('.stream-row');
    firstRow.querySelector('.row-channels').value = this.dataset.channels;
    firstRow.querySelector('.row-streams').value  = '1';

    document.getElementById('sampleRate').value = '48000';
    document.getElementById('bitDepth').value   = '24';
    document.getElementById('packetTime').value = '0.001';

    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    renumberRows();
    updateRemoveButtons();
    updateAddButton();
    calculate();
  });
});

// ── Deactivate presets on global config change ────────────────────────────────

['sampleRate', 'bitDepth', 'packetTime'].forEach(id => {
  ['input', 'change'].forEach(evt => {
    document.getElementById(id).addEventListener(evt, () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      calculate();
    });
  });
});

// ── Unit toggle ───────────────────────────────────────────────────────────────

document.querySelectorAll('.unit-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    if (forcedUnit === this.dataset.unit) {
      forcedUnit = null;
      document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
    } else {
      forcedUnit = this.dataset.unit;
      document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    }
    calculate();
  });
});

// ── Copy total bandwidth to clipboard ─────────────────────────────────────────

document.getElementById('copyBtn').addEventListener('click', () => {
  const valEl = document.getElementById('totalBw');
  const text  = valEl.textContent.trim();
  if (!text || text === '—') return;
  navigator.clipboard.writeText(text).then(() => {
    const btn   = document.getElementById('copyBtn');
    const label = document.getElementById('copyBtnLabel');
    label.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      label.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  });
});

// ── Export CSV ────────────────────────────────────────────────────────────────

function exportCSV() {
  const sampleRate = parseInt(document.getElementById('sampleRate').value);
  const bitDepth   = parseInt(document.getElementById('bitDepth').value);
  const packetTime = parseFloat(document.getElementById('packetTime').value);

  const packetTimeLabel = document.getElementById('packetTime').options[document.getElementById('packetTime').selectedIndex].text;
  const sampleRateLabel = document.getElementById('sampleRate').options[document.getElementById('sampleRate').selectedIndex].text;
  const bitDepthLabel   = document.getElementById('bitDepth').options[document.getElementById('bitDepth').selectedIndex].text;

  const samplesPerPkt = Math.round(sampleRate * packetTime);
  const pktRate       = 1 / packetTime;

  const rows = document.querySelectorAll('.stream-row');
  let totalBps = 0;
  const groupResults = [];

  rows.forEach(row => {
    const channels = Math.min(256,   Math.max(1, parseInt(row.querySelector('.row-channels').value) || 1));
    const streams  = Math.min(10000, Math.max(1, parseInt(row.querySelector('.row-streams').value)  || 1));
    const payloadBytes = channels * samplesPerPkt * (bitDepth / 8);
    const pktBytes     = payloadBytes + HEADER_BYTES;
    const bps          = pktBytes * 8 * pktRate;
    const groupBps     = bps * streams;
    totalBps += groupBps;
    groupResults.push({ channels, streams, bps, groupBps, payloadBytes, pktBytes });
  });

  const f = v => formatBw(v);
  const bwStr = bps => { const r = f(bps); return `${r.val} ${r.unit}`; };

  const lines = [
    ['RAVENNA / AES67 / ST 2110-30 Bandwidth Calculation'],
    [],
    ['Configuration'],
    ['Sample Rate', sampleRateLabel],
    ['Bit Depth', bitDepthLabel],
    ['Packet Time', packetTimeLabel],
    ['Header Overhead', '54 B (14B Eth + 20B IP + 8B UDP + 12B RTP)'],
    [],
    ['Stream Groups'],
    ['Group', 'Channels', 'Streams', 'Per Stream', 'Group Total'],
    ...groupResults.map((g, i) => [
      `Group ${i + 1}`,
      g.channels,
      g.streams,
      bwStr(g.bps),
      bwStr(g.groupBps),
    ]),
    [],
    ['Combined Total', '', '', '', bwStr(totalBps)],
    [],
    ['Packet Statistics (Group 1)'],
    ['Packet Rate', pktRate.toLocaleString('en-US') + ' pkt/s'],
    ['Samples per Packet', samplesPerPkt.toLocaleString('en-US') + ' per channel'],
    ['Audio Payload', fmtBytes(groupResults[0].payloadBytes)],
    ['Total Packet Size', fmtBytes(groupResults[0].pktBytes)],
  ];

  const csv = lines.map(row => row.map(cell => {
    const s = String(cell ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'ravenna-bandwidth.csv';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);

// ── Init ──────────────────────────────────────────────────────────────────────

addRow(); // adds Group 1 with defaults (2ch, 1 stream) matching the ST2110 2ch preset
