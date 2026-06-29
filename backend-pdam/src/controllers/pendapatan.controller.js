import db from "../config/db.js";

export const getAll = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const [rows] = await connection.query(
      "SELECT * FROM pendapatan ORDER BY tanggal DESC"
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};

export const create = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { tanggal, kategori, deskripsi, jumlah } = req.body;

    if (!tanggal || !kategori || !jumlah) {
      return res.status(400).json({
        message: "tanggal, kategori dan jumlah wajib diisi"
      });
    }

    const [result] = await connection.query(
      `INSERT INTO pendapatan
      (tanggal, kategori, deskripsi, jumlah)
      VALUES (?, ?, ?, ?)`,
      [
        tanggal,
        kategori,
        deskripsi || null,
        jumlah
      ]
    );

    res.status(201).json({
      success: true,
      message: "Pendapatan berhasil ditambahkan",
      data: {
        id: result.insertId,
        tanggal,
        kategori,
        deskripsi,
        jumlah
      }
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  } finally {
    connection.release();
  }
};

export const update = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { tanggal, kategori, deskripsi, jumlah } = req.body;

    const [cek] = await connection.query(
      "SELECT id FROM pendapatan WHERE id=?",
      [id]
    );

    if (cek.length === 0) {
      return res.status(404).json({
        message: "Data pendapatan tidak ditemukan"
      });
    }

    await connection.query(
      `UPDATE pendapatan
       SET tanggal=?,
           kategori=?,
           deskripsi=?,
           jumlah=?
       WHERE id=?`,
      [
        tanggal,
        kategori,
        deskripsi || null,
        jumlah,
        id
      ]
    );

    res.json({
      success: true,
      message: "Pendapatan berhasil diupdate"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  } finally {
    connection.release();
  }
};

export const remove = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;

    const [cek] = await connection.query(
      "SELECT id FROM pendapatan WHERE id=?",
      [id]
    );

    if (cek.length === 0) {
      return res.status(404).json({
        message: "Data tidak ditemukan"
      });
    }

    await connection.query(
      "DELETE FROM pendapatan WHERE id=?",
      [id]
    );

    res.json({
      success: true,
      message: "Pendapatan berhasil dihapus"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  } finally {
    connection.release();
  }
};