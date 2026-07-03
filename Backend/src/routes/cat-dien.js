const router = require('express').Router();
const { getOutages, syncOutages, listStations, getOutagesByStations } = require('../services/catDienService');

// GET /api/cat-dien?q=12/06&donVi=PC05HH
//   q     : "" | "tất cả" | "dd/MM" | tên trạm
//   donVi : mã đơn vị điện lực (mặc định Hiệp Đức, phụ trách Phước Thành); 'all' = toàn TP Đà Nẵng
router.get('/', async (req, res) => {
  try {
    const { q = '', donVi } = req.query;
    const items = await getOutages(q, donVi);
    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cat-dien/stations?donVi=PC05HH — danh sách tên trạm đã từng ghi nhận (cho mini app CatDien)
router.get('/stations', async (req, res) => {
  try {
    const { donVi } = req.query;
    const stations = await listStations(donVi);
    res.json({ stations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cat-dien/search?station=Tram+A,Tram+B&date=20/07&donVi=PC05HH — tra cứu kết hợp trạm + ngày (mini app CatDien)
router.get('/search', async (req, res) => {
  try {
    const { station = '', date = '', donVi } = req.query;
    const stationNames = station ? station.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const items = await getOutagesByStations(stationNames, date, donVi);
    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cat-dien/sync — cào lại ngay (tiện test, không chờ cron)
router.post('/sync', async (req, res) => {
  try {
    const synced = await syncOutages();
    res.json({ ok: true, synced });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
