export default function handler(req, res) {
  res.status(200).json({ ok: true, site: 'dynastynba.com', leagueId: '76513288', checkedAt: new Date().toISOString() });
}
