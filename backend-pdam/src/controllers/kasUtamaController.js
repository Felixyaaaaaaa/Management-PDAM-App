import db from "../config/db.js";


// =====================================
// GET ALL KAS UTAMA
// =====================================
export const getAll = async (req, res) => {
  const connection = await db.getConnection();

  try {

    const { bulan, tahun, jenis } = req.query;

    let where = "WHERE 1=1";
    let params = [];

    // filter tahun
    if (tahun) {
      where += " AND YEAR(tanggal)=?";
      params.push(tahun);
    }

    // filter bulan
    if (bulan && bulan !== "all") {
      where += " AND MONTH(tanggal)=?";
      params.push(bulan);
    }

    // filter jenis
    if (jenis) {
      where += " AND jenis=?";
      params.push(jenis);
    }

    const [rows] = await connection.query(
      `SELECT 
          ku.*,
          u.name as created_by_nama
       FROM kas_utama ku
       LEFT JOIN users u ON ku.created_by=u.id
       ${where}
       ORDER BY ku.tanggal DESC, ku.id DESC`,
      params
    );

    res.json({
      success: true,
      total_data: rows.length,
      data: rows
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  } finally {
    connection.release();
  }
};


// =====================================
// GET DETAIL
// =====================================
export const getById = async (req, res) => {
  const connection = await db.getConnection();

  try {

    const { id } = req.params;

    const [rows] = await connection.query(
      `SELECT 
          ku.*,
          u.name as created_by_nama
       FROM kas_utama ku
       LEFT JOIN users u ON ku.created_by=u.id
       WHERE ku.id=?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Data kas utama tidak ditemukan"
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  } finally {
    connection.release();
  }
};


// =====================================
// CREATE
// =====================================
export const create = async (req, res) => {
  const connection = await db.getConnection();

  try {

    const {
      tanggal,
      jenis,
      kategori,
      deskripsi,
      jumlah
    } = req.body;

    // validasi
    if (!tanggal || !jenis || !kategori || !jumlah) {
      return res.status(400).json({
        message: "tanggal, jenis, kategori, jumlah wajib diisi"
      });
    }

    if (!["masuk", "keluar"].includes(jenis)) {
      return res.status(400).json({
        message: "jenis hanya masuk atau keluar"
      });
    }

    if (Number(jumlah) <= 0) {
      return res.status(400).json({
        message: "jumlah harus lebih dari 0"
      });
    }

    const [result] = await connection.query(
      `INSERT INTO kas_utama
      (
        tanggal,
        jenis,
        kategori,
        deskripsi,
        jumlah,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tanggal,
        jenis,
        kategori,
        deskripsi || null,
        jumlah,
        req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      message: "Kas utama berhasil ditambahkan",
      id: result.insertId
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  } finally {
    connection.release();
  }
};


// =====================================
// UPDATE
// =====================================
export const update = async (req, res) => {
  const connection = await db.getConnection();

  try {

    const { id } = req.params;

    const {
      tanggal,
      jenis,
      kategori,
      deskripsi,
      jumlah
    } = req.body;

    // cek data
    const [cek] = await connection.query(
      `SELECT id FROM kas_utama WHERE id=?`,
      [id]
    );

    if (cek.length === 0) {
      return res.status(404).json({
        message: "Data kas utama tidak ditemukan"
      });
    }

    // validasi
    if (!tanggal || !jenis || !kategori || !jumlah) {
      return res.status(400).json({
        message: "tanggal, jenis, kategori, jumlah wajib diisi"
      });
    }

    if (!["masuk", "keluar"].includes(jenis)) {
      return res.status(400).json({
        message: "jenis hanya masuk atau keluar"
      });
    }

    if (Number(jumlah) <= 0) {
      return res.status(400).json({
        message: "jumlah harus lebih dari 0"
      });
    }

    await connection.query(
      `UPDATE kas_utama
       SET
          tanggal=?,
          jenis=?,
          kategori=?,
          deskripsi=?,
          jumlah=?
       WHERE id=?`,
      [
        tanggal,
        jenis,
        kategori,
        deskripsi || null,
        jumlah,
        id
      ]
    );

    res.json({
      success: true,
      message: "Kas utama berhasil diupdate"
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  } finally {
    connection.release();
  }
};


// =====================================
// DELETE
// =====================================
export const remove = async (req, res) => {
  const connection = await db.getConnection();

  try {

    const { id } = req.params;

    // cek data
    const [cek] = await connection.query(
      `SELECT id FROM kas_utama WHERE id=?`,
      [id]
    );

    if (cek.length === 0) {
      return res.status(404).json({
        message: "Data kas utama tidak ditemukan"
      });
    }

    await connection.query(
      `DELETE FROM kas_utama WHERE id=?`,
      [id]
    );

    res.json({
      success: true,
      message: "Kas utama berhasil dihapus"
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  } finally {
    connection.release();
  }
};


// =====================================
// SALDO KAS
// =====================================
export const getSaldo = async (req, res) => {
  const connection = await db.getConnection();

  try {

    const { bulan, tahun } = req.query;

    let where = "WHERE 1=1";
    let params = [];

    if (tahun) {
      where += " AND YEAR(tanggal)=?";
      params.push(tahun);
    }

    if (bulan && bulan !== "all") {
      where += " AND MONTH(tanggal)=?";
      params.push(bulan);
    }

    const [[saldo]] = await connection.query(
      `SELECT
          SUM(
            CASE
              WHEN jenis='masuk' THEN jumlah
              ELSE -jumlah
            END
          ) as saldo
       FROM kas_utama
       ${where}`,
      params
    );

    res.json({
      success: true,
      saldo: Number(saldo.saldo) || 0
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  } finally {
    connection.release();
  }
};

export const dashboard = async (req, res) => {
  const connection = await db.getConnection();

  try {

    const { bulan, tahun } = req.query;

    let where = "WHERE 1=1";
    let params = [];

    // ============================
    // FILTER TAHUN
    // ============================
    if (tahun) {
      where += " AND YEAR(tanggal)=?";
      params.push(tahun);
    }

    // ============================
    // FILTER BULAN
    // ============================
    if (bulan && bulan !== "all") {
      where += " AND MONTH(tanggal)=?";
      params.push(bulan);
    }

    // ============================
    // SUMMARY
    // ============================
    const [[summary]] = await connection.query(
      `SELECT
          COUNT(id) as total_transaksi,

          SUM(
            CASE
              WHEN jenis='masuk'
              THEN jumlah
              ELSE 0
            END
          ) as total_masuk,

          SUM(
            CASE
              WHEN jenis='keluar'
              THEN jumlah
              ELSE 0
            END
          ) as total_keluar,

          SUM(
            CASE
              WHEN jenis='masuk'
              THEN jumlah
              ELSE -jumlah
            END
          ) as saldo_kas

       FROM kas_utama
       ${where}`,
      params
    );

    // ============================
    // TRANSAKSI TERBARU
    // ============================
    const [recent] = await connection.query(
      `SELECT
          ku.id,
          ku.tanggal,
          ku.jenis,
          ku.kategori,
          ku.deskripsi,
          ku.jumlah,
          u.name as created_by_nama
       FROM kas_utama ku
       LEFT JOIN users u ON ku.created_by=u.id
       ${where}
       ORDER BY ku.tanggal DESC, ku.id DESC
       LIMIT 5`,
      params
    );

    // ============================
    // PENGELUARAN TERBESAR
    // ============================
    const [pengeluaranTerbesar] = await connection.query(
      `SELECT
          kategori,
          SUM(jumlah) as total
       FROM kas_utama
       ${where}
       ${where === "WHERE 1=1" ? "AND" : "AND"} jenis='keluar'
       GROUP BY kategori
       ORDER BY total DESC
       LIMIT 5`,
      params
    );

    // ============================
    // PEMASUKAN TERBESAR
    // ============================
    const [pemasukanTerbesar] = await connection.query(
      `SELECT
          kategori,
          SUM(jumlah) as total
       FROM kas_utama
       ${where}
       ${where === "WHERE 1=1" ? "AND" : "AND"} jenis='masuk'
       GROUP BY kategori
       ORDER BY total DESC
       LIMIT 5`,
      params
    );

    // ============================
    // HITUNG LABA/RUGI
    // ============================
    const totalMasuk = Number(summary.total_masuk) || 0;
    const totalKeluar = Number(summary.total_keluar) || 0;

    const labaRugi = totalMasuk - totalKeluar;

    // ============================
    // RESPONSE
    // ============================
    res.json({
      success: true,

      filter: tahun
        ? {
            tahun,
            bulan: bulan && bulan !== "all"
              ? bulan
              : "SEMUA"
          }
        : "SEMUA DATA",

      summary: {
        total_transaksi: summary.total_transaksi || 0,

        total_masuk: totalMasuk,

        total_keluar: totalKeluar,

        saldo_kas: Number(summary.saldo_kas) || 0,

        laba_rugi: labaRugi,

        status_keuangan:
          labaRugi >= 0
            ? "LABA"
            : "RUGI"
      },

      recent_transaction: recent,

      pengeluaran_terbesar: pengeluaranTerbesar,

      pemasukan_terbesar: pemasukanTerbesar
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  } finally {
    connection.release();
  }
};