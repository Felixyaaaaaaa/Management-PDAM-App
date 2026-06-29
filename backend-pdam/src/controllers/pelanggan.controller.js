import db from "../config/db.js";

console.log('[PELANGGAN CONTROLLER] Loaded\n');

//GET ALL PELANGGAN
export const getAll = async (req, res) => {
  try {
    console.log('[PELANGGAN] GET ALL - Request received');
    const [rows] = await db.query(
      "SELECT * FROM pelanggan ORDER BY id DESC"
    );

    console.log(`[PELANGGAN] ✓ Retrieved ${rows.length} records\n`);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.log(`[PELANGGAN] ✗ Error fetching data: ${error.message}\n`);
    res.status(500).json({ message: error.message });
  }
};

//GET ALL PELANGGAN BY ID
export const getById = async (req, res) => {
  try {
    const pelangganId = req.params.id;
    console.log(`[PELANGGAN] GET BY ID - Request: ID=${pelangganId}`);
    
    const [rows] = await db.query(
      "SELECT * FROM pelanggan WHERE id = ?",
      [pelangganId]
    );

    if (rows.length === 0) {
      console.log(`[PELANGGAN] ✗ Not found: ID=${pelangganId}`);
      return res.status(404).json({
        message: "Pelanggan tidak ditemukan"
      });
    }

    console.log(`[PELANGGAN] ✓ Found: ${rows[0].nama} (ID: ${rows[0].id})\n`);
    res.json(rows[0]);
  } catch (error) {
    console.log(`[PELANGGAN] ✗ Error: ${error.message}\n`);
    res.status(500).json({ message: error.message });
  }
};

//CREATE PELANGGAN
export const create = async (req, res) => {
  try {
    const {
      kode_pelanggan,
      nama,
      alamat,
      no_hp,
      nomor_meter,
      note
    } = req.body;
    
    console.log(`[PELANGGAN] CREATE - Request received`);
    console.log(`[PELANGGAN] Input: kode=${kode_pelanggan}, nama=${nama}, no_hp=${no_hp}`);

    await db.query(
      `INSERT INTO pelanggan 
      (kode_pelanggan, nama, alamat, no_hp, nomor_meter, note)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [kode_pelanggan, nama, alamat, no_hp, nomor_meter, note]
    );

    console.log(`[PELANGGAN] ✓ Created successfully: ${nama}\n`);
    res.status(201).json({
      success: true,
      message: "Pelanggan berhasil ditambahkan"
    });

  } catch (error) {
    console.log(`[PELANGGAN] ✗ Error creating: ${error.message}\n`);
    res.status(500).json({ message: error.message });
  }
};

//UPDATE PELANGGAN
export const update = async (req, res) => {
  try {
    const pelangganId = req.params.id;
    const { nama, alamat, no_hp, nomor_meter, status, note } = req.body;
    
    console.log(`[PELANGGAN] UPDATE - Request: ID=${pelangganId}`);
    console.log(`[PELANGGAN] Input: nama=${nama}, status=${status}`);

    await db.query(
      `UPDATE pelanggan 
       SET nama=?, alamat=?, no_hp=?, nomor_meter=?, status=?, note=?
       WHERE id=?`,
      [nama, alamat, no_hp, nomor_meter, status, note, pelangganId]
    );

    console.log(`[PELANGGAN] ✓ Updated successfully: ${nama}\n`);
    res.json({
      success: true,
      message: "Data pelanggan diperbarui"
    });

  } catch (error) {
    console.log(`[PELANGGAN] ✗ Error updating: ${error.message}\n`);
    res.status(500).json({ message: error.message });
  }
};

//DELETE PELANGGAN
export const remove = async (req, res) => {
  try {
    const pelangganId = req.params.id;
    console.log(`[PELANGGAN] DELETE - Request: ID=${pelangganId}`);

    await db.query(
      "DELETE FROM pelanggan WHERE id=?",
      [pelangganId]
    );

    console.log(`[PELANGGAN] ✓ Deleted successfully: ID=${pelangganId}\n`);
    res.json({
      success: true,
      message: "Pelanggan dihapus"
    });

  } catch (error) {
    console.log(`[PELANGGAN] ✗ Error deleting: ${error.message}\n`);
    res.status(500).json({ message: error.message });
  }
};


/// RESET METER ----- 
export const resetMeter = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params; // pelanggan_id

    // ============================
    // 1️⃣ AMBIL DATA PENCATATAN TERBARU
    // ============================
    const [[lastData]] = await connection.query(
      `SELECT id, bulan, tahun
       FROM pencatatan_meter
       WHERE pelanggan_id=?
       ORDER BY tahun DESC, bulan DESC
       LIMIT 1`,
      [id]
    );

    if (!lastData) {
      return res.status(404).json({
        message: "Data pencatatan tidak ditemukan"
      });
    }

    // ============================
    // 2️⃣ UPDATE METER AWAL MENJADI 0
    // ============================
    await connection.query(
      `UPDATE pencatatan_meter
       SET meter_awal=0,
           meter_akhir=0,
           pemakaian=0
       WHERE id=?`,
      [lastData.id]
    );

    res.json({
      success: true,
      message: "Meter berhasil direset",
      periode: {
        bulan: lastData.bulan,
        tahun: lastData.tahun
      }
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  } finally {
    connection.release();
  }
};