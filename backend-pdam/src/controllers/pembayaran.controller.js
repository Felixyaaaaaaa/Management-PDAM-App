import db from "../config/db.js";

console.log('[PEMBAYARAN CONTROLLER] Loaded\n');

export const create = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { tagihan_id, jumlah_bayar, metode } = req.body;

    console.log('[PEMBAYARAN] CREATE - Request received');
    console.log(`[PEMBAYARAN] Input: tagihan_id=${tagihan_id}, jumlah_bayar=${jumlah_bayar}, metode=${metode}`);

    console.log('[PEMBAYARAN] Starting transaction...');
    await connection.beginTransaction();

    // cek tagihan
    console.log(`[PEMBAYARAN] Checking invoice ID=${tagihan_id}...`);
    const [tagihan] = await connection.query(
      "SELECT * FROM tagihan WHERE id=?",
      [tagihan_id]
    );

    if (tagihan.length === 0) {
      console.log(`[PEMBAYARAN] ✗ Invoice NOT found: ID=${tagihan_id}`);
      await connection.rollback();
      return res.status(404).json({
        message: "Tagihan tidak ditemukan"
      });
    }

    console.log(`[PEMBAYARAN] ✓ Found invoice: amount=${tagihan[0].total_tagihan}, status=${tagihan[0].status}`);

    if (tagihan[0].status === "lunas") {
      console.log('[PEMBAYARAN] ✗ Invoice already PAID');
      await connection.rollback();
      return res.status(400).json({
        message: "Tagihan sudah lunas"
      });
    }

    // insert pembayaran
    console.log('[PEMBAYARAN] Recording payment...');
    await connection.query(
      `INSERT INTO pembayaran
      (tagihan_id, tanggal_bayar, jumlah_bayar, metode)
      VALUES (?, NOW(), ?, ?)`,
      [tagihan_id, jumlah_bayar, metode]
    );
    console.log(`[PEMBAYARAN] ✓ Payment recorded: ${jumlah_bayar} via ${metode}`);

    // update status tagihan
    console.log('[PEMBAYARAN] Updating invoice status to PAID...');
    await connection.query(
      "UPDATE tagihan SET status='lunas' WHERE id=?",
      [tagihan_id]
    );
    console.log('[PEMBAYARAN] ✓ Invoice status updated to LUNAS');

    console.log('[PEMBAYARAN] Committing transaction...');
    await connection.commit();
    console.log('[PEMBAYARAN] ✓ Payment successful\n');

    res.json({
      success: true,
      message: "Pembayaran berhasil"
    });

  } catch (error) {

    console.log('[PEMBAYARAN] ✗ Error occurred, rolling back transaction');
    await connection.rollback();
    console.log(`[PEMBAYARAN] ✗ Error: ${error.message}\n`);

    res.status(500).json({
      message: error.message
    });

  } finally {
    connection.release();
  }
};
