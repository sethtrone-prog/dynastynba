import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'site-data.json');
    const db = JSON.parse(fs.readFileSync(file, 'utf8'));
    const matches = [];
    for (const [key, value] of Object.entries(db)) {
      if (!Array.isArray(value)) continue;
      const keyMatch = /g\s*[-_]?\s*league|gleague|reserve/i.test(key);
      const sample = value.slice(0, 5);
      const fields = [...new Set(sample.flatMap(row => row && typeof row === 'object' ? Object.keys(row) : []))];
      const fieldMatch = fields.some(f => /g\s*[-_]?\s*league|gleague|reserve|games?\s*played|gp/i.test(f));
      if (keyMatch || fieldMatch) {
        matches.push({ key, count: value.length, fields, sample });
      }
    }
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(200).json({ ok: true, matches });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'debug read failed' });
  }
}
