import db from "../config/db.js";

console.log('[TAGIHAN CONTROLLER] Loaded\n');

// ========================
// GET ALL TAGIHAN
// ========================
export const getAll = async (req, res) => {
  try {
    console.log('[TAGIHAN] GET ALL - Request received');

    const [rows] = await db.query(`
      SELECT 
        t.*,
        p.nama,
        p.kode_pelanggan,
        pm.bulan,
        pm.tahun,
        pm.pemakaian
      FROM tagihan t
      JOIN pencatatan_meter pm ON t.pencatatan_id = pm.id
      JOIN pelanggan p ON pm.pelanggan_id = p.id
      ORDER BY t.id DESC
    `);

    console.log(`[TAGIHAN] ✓ Retrieved ${rows.length} invoices\n`);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.log(`[TAGIHAN] ✗ Error fetching data: ${error.message}\n`);
    res.status(500).json({ message: error.message });
  }
};

// ========================
// UPDATE TOTAL TAGIHAN
// ========================
export const updateTotalTagihan = async (req, res) => {
  try {
    const { id } = req.params;
    const { total_tagihan } = req.body;

    // Validasi input
    if (total_tagihan === undefined) {
      return res.status(400).json({
        success: false,
        message: "total_tagihan wajib diisi"
      });
    }

    // Cek apakah tagihan ada
    const [existing] = await db.query(
      "SELECT id FROM tagihan WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tagihan tidak ditemukan"
      });
    }

    // Update hanya total_tagihan
    await db.query(
      "UPDATE tagihan SET total_tagihan = ? WHERE id = ?",
      [total_tagihan, id]
    );

    res.json({
      success: true,
      message: "Total tagihan berhasil diperbarui"
    });

  } catch (error) {
    console.log(`[TAGIHAN] ✗ Error update: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


// ========================
// TAGIHAN BELUM BAYAR
// ========================
export const getBelumBayar = async (req, res) => {
  try {
    console.log('[TAGIHAN] GET UNPAID - Request received');
    const [rows] = await db.query(`
      SELECT t.*, p.nama, p.kode_pelanggan
      FROM tagihan t
      JOIN pencatatan_meter pm ON t.pencatatan_id = pm.id
      JOIN pelanggan p ON pm.pelanggan_id = p.id
      WHERE t.status = 'belum_bayar'
      ORDER BY t.id DESC
    `);

    console.log(`[TAGIHAN] ✓ Retrieved ${rows.length} unpaid invoices\n`);
    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.log(`[TAGIHAN] ✗ Error fetching unpaid data: ${error.message}\n`);
    res.status(500).json({ message: error.message });
  }
};


// ========================
// DETAIL TAGIHAN
// ========================
export const getById = async (req, res) => {
  try {
    const tagihanId = req.params.id;
    console.log(`[TAGIHAN] GET BY ID - Request: ID=${tagihanId}`);
    
    const [rows] = await db.query(
      `SELECT t.*, p.nama, p.kode_pelanggan
       FROM tagihan t
       JOIN pencatatan_meter pm ON t.pencatatan_id = pm.id
       JOIN pelanggan p ON pm.pelanggan_id = p.id
       WHERE t.id = ?`,
      [tagihanId]
    );

    if (rows.length === 0) {
      console.log(`[TAGIHAN] ✗ Not found: ID=${tagihanId}`);
      return res.status(404).json({
        message: "Tagihan tidak ditemukan"
      });
    }

    console.log(`[TAGIHAN] ✓ Found: ${rows[0].nama} - ${rows[0].total_tagihan}\n`);
    res.json(rows[0]);

  } catch (error) {
    console.log(`[TAGIHAN] ✗ Error: ${error.message}\n`);
    res.status(500).json({ message: error.message });
  }
};


export const listPetugas = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    
    console.log('[TAGIHAN] LIST PETUGAS - Request received');
    console.log(`[TAGIHAN] Filter: bulan=${bulan || 'all'}, tahun=${tahun || 'all'}`);

    let query = `
      SELECT
        p.id AS pelanggan_id,
        p.kode_pelanggan,
        p.nama,
        p.alamat,

        pm.id AS pencatatan_id,
        pm.bulan,
        pm.tahun,
        pm.meter_awal,
        pm.meter_akhir,
        pm.pemakaian,
        pm.status AS status_pencatatan,

        t.id AS tagihan_id,
        t.total_tagihan,
        t.status AS status_tagihan

      FROM tagihan t
      JOIN pencatatan_meter pm ON t.pencatatan_id = pm.id
      JOIN pelanggan p ON pm.pelanggan_id = p.id
      WHERE t.status = 'belum_bayar'
    `;

    const params = [];

    // filter bulan & tahun jika ada
    if (bulan && tahun) {
      console.log(`[TAGIHAN] Applying filter: bulan=${bulan}, tahun=${tahun}`);
      query += " AND pm.bulan = ? AND pm.tahun = ?";
      params.push(bulan, tahun);
    }

    query += " ORDER BY p.nama ASC";

    const [rows] = await db.query(query, params);

    console.log(`[TAGIHAN] ✓ Retrieved ${rows.length} records for officers\n`);
    res.json({
      success: true,
      total_data: rows.length,
      data: rows
    });

  } catch (error) {
    console.log(`[TAGIHAN] ✗ Error: ${error.message}\n`);
    res.status(500).json({
      message: error.message
    });
  }
};

export const listPetugasApp = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    
    console.log('[TAGIHAN] LIST PETUGAS - Request received');
    console.log(`[TAGIHAN] Filter: bulan=${bulan || 'all'}, tahun=${tahun || 'all'}`);

    let query = `
      SELECT
        p.id AS pelanggan_id,
        p.kode_pelanggan,
        p.nama,
        p.alamat,

        pm.id AS pencatatan_id,
        pm.bulan,
        pm.tahun,
        pm.meter_awal,
        pm.meter_akhir,
        pm.pemakaian,
        pm.status AS status_pencatatan,

        t.id AS tagihan_id,
        t.total_tagihan,
        t.status AS status_tagihan,

        -- Logika is_editable: 
        -- Mengembalikan 1 (true) jika TIDAK ADA pencatatan di bulan/tahun setelahnya
        -- Mengembalikan 0 (false) jika SUDAH ADA pencatatan bulan berikutnya
        (
          SELECT COUNT(*) 
          FROM pencatatan_meter pm2 
          WHERE pm2.pelanggan_id = p.id 
          AND (
            pm2.tahun > pm.tahun 
            OR (pm2.tahun = pm.tahun AND pm2.bulan > pm.bulan)
          )
        ) = 0 AS is_editable

      FROM tagihan t
      JOIN pencatatan_meter pm ON t.pencatatan_id = pm.id
      JOIN pelanggan p ON pm.pelanggan_id = p.id
      WHERE 1=1
    `;

    const params = [];

    // filter bulan & tahun jika ada
    if (bulan && tahun) {
      console.log(`[TAGIHAN] Applying filter: bulan=${bulan}, tahun=${tahun}`);
      query += " AND pm.bulan = ? AND pm.tahun = ?";
      params.push(bulan, tahun);
    }

    query += " ORDER BY p.nama ASC";

    const [rows] = await db.query(query, params);

    console.log(`[TAGIHAN] ✓ Retrieved ${rows.length} records for officers\n`);
    res.json({
      success: true,
      total_data: rows.length,
      data: rows
    });

  } catch (error) {
    console.log(`[TAGIHAN] ✗ Error: ${error.message}\n`);
    res.status(500).json({
      message: error.message
    });
  }
};


export const bayarTagihan = async (req, res) => {  
  const connection = await db.getConnection();

  try {
    const tagihanId = req.params.id;

    await connection.beginTransaction();

    // cek tagihan
    const [rows] = await connection.query(
      "SELECT * FROM tagihan WHERE id=?",
      [tagihanId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: "Tagihan tidak ditemukan"
      });
    }

    if (rows[0].status === "lunas") {
      await connection.rollback();
      return res.status(400).json({
        message: "Tagihan sudah lunas"
      });
    }

    // update status
    await connection.query(
      `UPDATE tagihan
       SET status='lunas'
       WHERE id=?`,
      [tagihanId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Tagihan berhasil dibayar"
    });

  } catch (error) {

    await connection.rollback();

    res.status(500).json({
      message: error.message
    });

  } finally {
    connection.release();
  }
};
