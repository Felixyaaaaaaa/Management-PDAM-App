import db from "../config/db.js";
import hitungTagihan from "../utils/hitungTagihan.js";

console.log("[PENCATATAN CONTROLLER] Loaded\n");

// =========================
// GET ALL PENCATATAN
// =========================
export const getAll = async (req, res) => {
  try {
    console.log("[PENCATATAN] GET ALL - Request received");
    const [rows] = await db.query(`
      SELECT pm.*, p.nama, p.kode_pelanggan
      FROM pencatatan_meter pm
      JOIN pelanggan p ON pm.pelanggan_id = p.id
      ORDER BY pm.id DESC
    `);

    console.log(`[PENCATATAN] ✓ Retrieved ${rows.length} records\n`);
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.log(`[PENCATATAN] ✗ Error fetching data: ${error.message}\n`);
    res.status(500).json({ message: error.message });
  }
};

// =========================
// GET DETAIL
// =========================
export const getById = async (req, res) => {
  try {
    const pencatatanId = req.params.id;
    console.log(`[PENCATATAN] GET BY ID - Request: ID=${pencatatanId}`);

    const [rows] = await db.query(
      "SELECT * FROM pencatatan_meter WHERE id = ?",
      [pencatatanId],
    );

    if (rows.length === 0) {
      console.log(`[PENCATATAN] ✗ Not found: ID=${pencatatanId}`);
      return res.status(404).json({
        message: "Data tidak ditemukan",
      });
    }

    console.log(`[PENCATATAN] ✓ Found (ID: ${rows[0].id})\n`);
    res.json(rows[0]);
  } catch (error) {
    console.log(`[PENCATATAN] ✗ Error: ${error.message}\n`);
    res.status(500).json({ message: error.message });
  }
};

export const generateBulanan = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { bulan, tahun } = req.body;

    console.log("[PENCATATAN] GENERATE BULANAN - Request received");
    console.log(`[PENCATATAN] Input: bulan=${bulan}, tahun=${tahun}`);

    if (!bulan || !tahun) {
      return res.status(400).json({
        message: "bulan dan tahun wajib diisi",
      });
    }

    // START TRANSACTION
    await connection.beginTransaction();

    // ============================
    // AMBIL PELANGGAN AKTIF
    // ============================
    const [pelanggan] = await connection.query(
      "SELECT id FROM pelanggan WHERE status='aktif'"
    );

    let totalGenerated = 0;

    for (const p of pelanggan) {

      // ============================
      // CEK DUPLIKAT BULAN
      // ============================
      const [cek] = await connection.query(
        `SELECT id FROM pencatatan_meter
         WHERE pelanggan_id=? AND bulan=? AND tahun=?`,
        [p.id, bulan, tahun]
      );

      if (cek.length > 0) {
        console.log(
          `[PENCATATAN] Skip pelanggan ${p.id} (already generated)`
        );
        continue;
      }

      // ============================
      // AMBIL METER TERAKHIR
      // jika meter_akhir NULL -> pakai meter_awal
      // ============================
      const [last] = await connection.query(
        `SELECT 
            COALESCE(meter_akhir, meter_awal) AS meter_terakhir
         FROM pencatatan_meter
         WHERE pelanggan_id=?
         ORDER BY id DESC
         LIMIT 1`,
        [p.id]
      );

      const meterAwal =
        last.length > 0 ? last[0].meter_terakhir : 0;

      console.log(
        `[PENCATATAN] Customer ${p.id} -> meter_awal=${meterAwal}`
      );

      // ============================
      // INSERT PENCATATAN BARU
      // ============================
      const [result] = await connection.query(
        `INSERT INTO pencatatan_meter
        (pelanggan_id, bulan, tahun, meter_awal, meter_akhir, pemakaian, status)
        VALUES (?, ?, ?, ?, NULL, NULL, 'belum_dicatat')`,
        [p.id, bulan, tahun, meterAwal]
      );

      const pencatatanId = result.insertId;

      // ============================
      // INSERT TAGIHAN AWAL
      // ============================
      await connection.query(
        `INSERT INTO tagihan
        (pencatatan_id, total_tagihan, status)
        VALUES (?, ?, 'belum_bayar')`,
        [pencatatanId, 3000] // biaya tetap
      );

      totalGenerated++;
    }

    // COMMIT
    await connection.commit();

    res.json({
      success: true,
      message: "Generate bulan berhasil",
      total_data: totalGenerated,
    });

  } catch (error) {

    await connection.rollback();

    res.status(500).json({
      message: error.message,
    });

  } finally {
    connection.release();
  }
};


export const updateMeterAkhir = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { meter_akhir } = req.body;
    const pencatatanId = req.params.id;

    if (meter_akhir == null) {
      return res.status(400).json({
        message: "meter_akhir wajib diisi",
      });
    }

    await connection.beginTransaction();

    // ============================
    // AMBIL DATA PENCATATAN
    // ============================
    const [rows] = await connection.query(
      `SELECT * FROM pencatatan_meter WHERE id=?`,
      [pencatatanId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: "Data pencatatan tidak ditemukan",
      });
    }

    const pencatatan = rows[0];
    const meter_awal = pencatatan.meter_awal;

    // ============================
    // CEK STATUS TAGIHAN
    // ============================
    const [tagihanRows] = await connection.query(
      `SELECT status FROM tagihan
       WHERE pencatatan_id=?`,
      [pencatatanId]
    );

    if (tagihanRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: "Tagihan tidak ditemukan",
      });
    }

    // jika sudah lunas tidak boleh update
    if (tagihanRows[0].status === "lunas") {
      await connection.rollback();
      return res.status(400).json({
        message: "Tagihan sudah lunas, meter tidak bisa diubah",
      });
    }

    // ============================
    // VALIDASI
    // ============================
    if (meter_akhir < meter_awal) {
      await connection.rollback();
      return res.status(400).json({
        message: "Meter akhir tidak boleh lebih kecil dari meter awal",
      });
    }

    // ============================
    // HITUNG ULANG
    // ============================
    const pemakaian = meter_akhir - meter_awal;
    const totalTagihan = hitungTagihan(pemakaian);

    // ============================
    // UPDATE PENCATATAN
    // ============================
    await connection.query(
      `UPDATE pencatatan_meter
       SET meter_akhir=?,
           pemakaian=?,
           status='sudah_dicatat',
           dicatat_oleh=?
       WHERE id=?`,
      [meter_akhir, pemakaian, req.user.id, pencatatanId]
    );

    // ============================
    // UPDATE TAGIHAN
    // ============================
    await connection.query(
      `UPDATE tagihan
       SET total_tagihan=?
       WHERE pencatatan_id=?`,
      [totalTagihan, pencatatanId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Meter berhasil diupdate",
      data: {
        meter_awal,
        meter_akhir,
        pemakaian,
        total_tagihan: totalTagihan,
      },
    });

  } catch (error) {

    await connection.rollback();

    res.status(500).json({
      message: error.message,
    });

  } finally {
    connection.release();
  }
};


