import db from "../config/db.js";

export const getAll = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const [rows] = await connection.query(
      "SELECT * FROM pengeluaran ORDER BY tanggal DESC"
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

    await connection.query(
      `INSERT INTO pengeluaran (tanggal, kategori, deskripsi, jumlah)
       VALUES (?, ?, ?, ?)`,
      [tanggal, kategori, deskripsi || null, jumlah]
    );

    res.json({
      success: true,
      message: "Pengeluaran berhasil ditambahkan"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};

export const update = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { tanggal, kategori, deskripsi, jumlah } = req.body;

    await connection.query(
      `UPDATE pengeluaran
       SET tanggal=?, kategori=?, deskripsi=?, jumlah=?
       WHERE id=?`,
      [tanggal, kategori, deskripsi, jumlah, id]
    );

    res.json({
      success: true,
      message: "Pengeluaran berhasil diupdate"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};

const deleteRecord = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;

    await connection.query(
      "DELETE FROM pengeluaran WHERE id=?",
      [id]
    );

    res.json({
      success: true,
      message: "Pengeluaran berhasil dihapus"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};

export { deleteRecord as delete };