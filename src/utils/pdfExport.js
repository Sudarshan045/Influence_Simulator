/**
 * pdfExport.js — Simulator PDF Report Generator
 * ================================================
 * Generates a styled PDF report for a simulation result using jsPDF.
 * No external chart images needed — all data rendered as styled tables/bars.
 */

export async function exportSimulatorPDF(idea, result, scenario) {
  // Dynamically import jsPDF to keep bundle size small
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210; // A4 width mm
  const MARGIN = 18;
  const CONTENT_W = W - MARGIN * 2;
  let y = 0;

  // ── Colour helpers ──────────────────────────────────────────────────────────
  const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 42, 'F');

  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 5, 42, 'F');

  doc.setTextColor(167, 139, 250);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('INFLUENCE SIMULATOR', MARGIN, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(idea, MARGIN, 24);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Full Simulation Report  ·  Generated ${new Date().toLocaleString()}`, MARGIN, 34);

  y = 52;

  // ── Section helper ──────────────────────────────────────────────────────────
  const section = (title) => {
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(MARGIN, y, CONTENT_W, 8, 2, 2, 'F');
    doc.setTextColor(167, 139, 250);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), MARGIN + 4, y + 5.5);
    y += 13;
  };

  const kv = (label, value, valueColor = [255, 255, 255]) => {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label, MARGIN, y);
    doc.setTextColor(...valueColor);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), MARGIN + 70, y);
    y += 6;
  };

  // ── Revival Probability Hero ────────────────────────────────────────────────
  section('Simulation Overview');

  const prob = Math.round(result.revival_probability);
  const probColor = prob >= 70 ? [52, 211, 153] : prob >= 45 ? [251, 191, 36] : [248, 113, 113];

  doc.setFillColor(124, 58, 237, 0.1);
  doc.setDrawColor(124, 58, 237);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3, 3, 'S');

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Revival Probability', MARGIN + 4, y + 7);

  doc.setTextColor(...probColor);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text(`${prob}%`, MARGIN + 4, y + 18);

  // Bar
  const barX = MARGIN + 55;
  const barY = y + 10;
  const barW = CONTENT_W - 60;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(barX, barY, barW, 6, 2, 2, 'F');
  doc.setFillColor(...probColor);
  doc.roundedRect(barX, barY, barW * (prob / 100), 6, 2, 2, 'F');

  y += 28;

  kv('Current State', result.current_state || '—', [167, 139, 250]);
  kv('Peak Year Estimate', result.peak_year_estimate || 'N/A', [34, 211, 238]);
  kv('Confidence Score', `${Math.round(result.confidence_score ?? 0)}%`, [52, 211, 153]);
  kv('Karma Score', `${result.karma_score?.toFixed(1) ?? '—'}%`, [251, 191, 36]);
  kv('Profile Match', result.karma_breakdown?._match_type ?? '—', [148, 163, 184]);

  y += 4;

  // ── Karma Components ────────────────────────────────────────────────────────
  section('Karma Breakdown (Per-Factor)');

  const karmaEntries = Object.entries(result.karma_breakdown ?? {})
    .filter(([k]) => k !== '_match_type');

  karmaEntries.forEach(([key, val]) => {
    const pct = (val * 100).toFixed(1);
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label, MARGIN, y + 4);

    doc.setTextColor(34, 211, 238);
    doc.setFont('helvetica', 'bold');
    doc.text(`${pct}%`, MARGIN + 70, y + 4);

    // Mini bar
    const bx = MARGIN + 85;
    const bw = CONTENT_W - 90;
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(bx, y, bw, 4, 1, 1, 'F');
    const fillColor = val > 0.6 ? [16, 185, 129] : val > 0.35 ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(...fillColor);
    doc.roundedRect(bx, y, bw * val, 4, 1, 1, 'F');

    y += 8;
  });

  y += 4;

  // ── Lifecycle Stages ────────────────────────────────────────────────────────
  section('Lifecycle Stage Progression');

  const STATES = result.states ?? ['Birth', 'Growth', 'Peak', 'Decline', 'Dormancy', 'Revival'];
  const stateColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b', '#8b5cf6'];

  STATES.forEach((state, idx) => {
    const val = (result.progressionValues?.[idx] ?? 0) / 100;
    const pct = Math.round(val * 100);
    const [r, g, b] = hex2rgb(stateColors[idx] || '#8b5cf6');

    doc.setFillColor(r, g, b);
    doc.circle(MARGIN + 3, y + 3, 2.5, 'F');

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(state, MARGIN + 9, y + 4.5);

    const bx = MARGIN + 45;
    const bw = CONTENT_W - 55;
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(bx, y, bw, 5, 1.5, 1.5, 'F');
    doc.setFillColor(r, g, b);
    doc.roundedRect(bx, y, bw * val, 5, 1.5, 1.5, 'F');

    doc.setTextColor(r, g, b);
    doc.setFont('helvetica', 'bold');
    doc.text(`${pct}%`, bx + bw + 3, y + 4.5);

    y += 9;
  });

  y += 4;

  // ── Scenario Conditions ─────────────────────────────────────────────────────
  if (scenario) {
    // Check page space
    if (y > 240) { doc.addPage(); y = 20; }
    section('Scenario Conditions Applied');
    const scenarioMap = {
      'Economic Conditions':   scenario.economicConditions ?? 50,
      'Mental Health Index':   scenario.mentalHealthIndex  ?? 50,
      'Social Trend Intensity':scenario.socialTrendIntensity ?? 50,
      'Productivity Culture':  scenario.productivityCulture ?? 50,
      'Social Fragmentation':  scenario.socialFragmentation ?? 50,
    };
    Object.entries(scenarioMap).forEach(([label, val]) => {
      kv(label, `${val}/100`, val >= 70 ? [52, 211, 153] : val >= 40 ? [251, 191, 36] : [248, 113, 113]);
    });
    if (scenario.region) kv('Region', scenario.region, [167, 139, 250]);
    y += 4;
  }

  // ── Historical Context (if available from ideas catalogue) ──────────────────
  if (y > 220) { doc.addPage(); y = 20; }
  section('AI Explanation');
  if (result.explanation) {
    const lines = doc.splitTextToSize(result.explanation, CONTENT_W - 8);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    lines.forEach((line) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, MARGIN, y);
      y += 5;
    });
  } else {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('No AI explanation available for this simulation.', MARGIN, y);
    y += 6;
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 285, W, 12, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Influence Simulator — Cultural Lifecycle Intelligence Platform', MARGIN, 291);
    doc.text(`Page ${i} of ${pages}`, W - MARGIN - 20, 291);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const safeIdea = idea.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`influence_report_${safeIdea}_${Date.now()}.pdf`);
}
