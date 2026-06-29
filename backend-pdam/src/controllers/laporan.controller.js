import db from "../config/db.js";

export const dashboard = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { bulan, tahun } = req.query;

    const whereParts = [];
    const params = [];

    // ============================
    // FILTER TAGIHAN
    // ============================
    if (tahun) {
      whereParts.push("p.tahun=?");
      params.push(tahun);
    }

    if (bulan && bulan !== "all") {
      whereParts.push("p.bulan=?");
      params.push(bulan);
    }

    const filter =
      whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

    // ============================
    // TOTAL PELANGGAN AKTIF
    // ============================
    const [[pelanggan]] = await connection.query(
      `SELECT COUNT(*) as total
       FROM pelanggan
       WHERE status='aktif'`
    );

    // ============================
    // TOTAL TAGIHAN
    // ============================
    const [[tagihan]] = await connection.query(
      `SELECT 
          COUNT(t.id) as total_tagihan,
          SUM(t.total_tagihan) as total_nominal
       FROM tagihan t
       JOIN pencatatan_meter p ON t.pencatatan_id=p.id
       ${filter}`,
      params
    );

    // ============================
    // STATUS TAGIHAN
    // ============================
    const [[status]] = await connection.query(
      `SELECT
        SUM(CASE WHEN t.status='lunas' THEN 1 ELSE 0 END) as total_lunas,
        SUM(CASE WHEN t.status='belum_bayar' THEN 1 ELSE 0 END) as total_belum_bayar,
        SUM(CASE WHEN t.status='lunas' THEN t.total_tagihan ELSE 0 END) as total_pendapatan_tagihan
       FROM tagihan t
       JOIN pencatatan_meter p ON t.pencatatan_id=p.id
       ${filter}`,
      params
    );

    // ============================
    // TOTAL TUNGGAKAN
    // ============================
    let tunggakanQuery = `
      SELECT SUM(t.total_tagihan) as total_tunggakan
      FROM tagihan t
      JOIN pencatatan_meter p ON t.pencatatan_id=p.id
      WHERE t.status='belum_bayar'
    `;

    const tunggakanParams = [];

    if (tahun) {
      tunggakanQuery += " AND p.tahun=?";
      tunggakanParams.push(tahun);
    }

    if (bulan && bulan !== "all") {
      tunggakanQuery += " AND p.bulan=?";
      tunggakanParams.push(bulan);
    }

    const [[tunggakan]] = await connection.query(
      tunggakanQuery,
      tunggakanParams
    );

    // ============================
    // TOTAL PENGELUARAN
    // ============================
    let pengeluaranQuery = `
      SELECT SUM(jumlah) as total_pengeluaran
      FROM pengeluaran
      WHERE 1=1
    `;

    const pengeluaranParams = [];

    if (tahun) {
      pengeluaranQuery += " AND YEAR(tanggal)=?";
      pengeluaranParams.push(tahun);
    }

    if (bulan && bulan !== "all") {
      pengeluaranQuery += " AND MONTH(tanggal)=?";
      pengeluaranParams.push(bulan);
    }

    const [[pengeluaran]] = await connection.query(
      pengeluaranQuery,
      pengeluaranParams
    );

    // ============================
    // PENDAPATAN TAMBAHAN
    // ============================
    let pendapatanQuery = `
      SELECT SUM(jumlah) as total_pendapatan_tambahan
      FROM pendapatan
      WHERE 1=1
    `;

    const pendapatanParams = [];

    if (tahun) {
      pendapatanQuery += " AND YEAR(tanggal)=?";
      pendapatanParams.push(tahun);
    }

    if (bulan && bulan !== "all") {
      pendapatanQuery += " AND MONTH(tanggal)=?";
      pendapatanParams.push(bulan);
    }

    const [[pendapatanTambahan]] = await connection.query(
      pendapatanQuery,
      pendapatanParams
    );

    // ============================
    // HITUNG KEUANGAN
    // ============================

    const totalPendapatanTagihan =
      Number(status.total_pendapatan_tagihan) || 0;

    const totalPendapatanTambahan =
      Number(pendapatanTambahan.total_pendapatan_tambahan) || 0;

    const totalPendapatan =
      totalPendapatanTagihan + totalPendapatanTambahan;

    const totalPengeluaran =
      Number(pengeluaran.total_pengeluaran) || 0;

    const labaRugi = totalPendapatan - totalPengeluaran;

    // ============================
    // RESPONSE
    // ============================
    res.json({
      success: true,

      filter: tahun
        ? {
            tahun,
            bulan: bulan && bulan !== "all" ? bulan : "SEMUA"
          }
        : "SEMUA DATA",

      data: {
        total_pelanggan: pelanggan.total || 0,

        total_tagihan: tagihan.total_tagihan || 0,
        total_nominal: tagihan.total_nominal || 0,

        total_lunas: status.total_lunas || 0,
        total_belum_bayar: status.total_belum_bayar || 0,

        total_pendapatan_tagihan: totalPendapatanTagihan,
        total_pendapatan_tambahan: totalPendapatanTambahan,

        total_pendapatan: totalPendapatan,

        total_tunggakan: tunggakan.total_tunggakan || 0,

        total_pengeluaran: totalPengeluaran,

        laba_rugi: labaRugi,
        status_keuangan: labaRugi >= 0 ? "LABA" : "RUGI"
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

export const laporanTagihan = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { bulan, tahun, status } = req.query;

    if (!bulan || !tahun) {
      return res.status(400).json({
        message: "bulan dan tahun wajib diisi"
      });
    }

    let whereClause = "WHERE p.bulan=? AND p.tahun=?";
    let params = [bulan, tahun];

    if (status) {
      whereClause += " AND t.status=?";
      params.push(status);
    }

    // ============================
    // DATA DETAIL
    // ============================
    const [rows] = await connection.query(
      `SELECT 
          pl.nama,
          pl.kode_pelanggan,
          pl.alamat,
          p.meter_awal,
          p.meter_akhir,
          p.pemakaian,
          t.total_tagihan,
          t.status
       FROM tagihan t
       JOIN pencatatan_meter p ON t.pencatatan_id=p.id
       JOIN pelanggan pl ON p.pelanggan_id=pl.id
       ${whereClause}
       ORDER BY pl.nama ASC`,
      params
    );

    // ============================
    // TAMBAH BIAYA BEBAN & PEMAKAIAN RP
    // ============================
    const BIAYA_BEBAN = 3000;

    const data = rows.map((item) => {
      const totalTagihan = Number(item.total_tagihan);

      return {
        ...item,
        biaya_beban: BIAYA_BEBAN,
        biaya_pemakaian_rp: totalTagihan - BIAYA_BEBAN
      };
    });

    // ============================
    // SUMMARY
    // ============================
    const [[summary]] = await connection.query(
      `SELECT
          COUNT(t.id) as total_data,
          SUM(t.total_tagihan) as total_nominal,
          SUM(CASE WHEN t.status='lunas' THEN 1 ELSE 0 END) as total_lunas,
          SUM(CASE WHEN t.status='belum_bayar' THEN 1 ELSE 0 END) as total_belum_bayar,
          SUM(CASE WHEN t.status='lunas' THEN t.total_tagihan ELSE 0 END) as total_pendapatan
       FROM tagihan t
       JOIN pencatatan_meter p ON t.pencatatan_id=p.id
       WHERE p.bulan=? AND p.tahun=?`,
      [bulan, tahun]
    );

    res.json({
      success: true,
      filter: {
        bulan,
        tahun,
        status: status || "SEMUA"
      },
      summary: {
        total_data: summary.total_data || 0,
        total_nominal: summary.total_nominal || 0,
        total_lunas: summary.total_lunas || 0,
        total_belum_bayar: summary.total_belum_bayar || 0,
        total_pendapatan: summary.total_pendapatan || 0,
        biaya_beban_flat: BIAYA_BEBAN
      },
      data
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  } finally {
    connection.release();
  }
};

export const laporanPendapatan = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { bulan, tahun, mode } = req.query;

    const normalizedMode = String(mode || "").toLowerCase();

    const effectiveMode =
      normalizedMode === "bulanan" || normalizedMode === "tahunan"
        ? normalizedMode
        : bulan
        ? "bulanan"
        : "tahunan";

    if (!tahun) {
      return res.status(400).json({
        message: "tahun wajib diisi"
      });
    }

    if (effectiveMode === "bulanan" && !bulan) {
      return res.status(400).json({
        message: "bulan wajib diisi untuk mode bulanan"
      });
    }

    // ============================
    // MODE TAHUNAN
    // ============================
    if (effectiveMode === "tahunan") {

      // pendapatan tagihan
      const [tagihan] = await connection.query(
        `SELECT 
            p.bulan,
            SUM(t.total_tagihan) as total
         FROM tagihan t
         JOIN pencatatan_meter p ON t.pencatatan_id=p.id
         WHERE p.tahun=? AND t.status='lunas'
         GROUP BY p.bulan
         ORDER BY p.bulan ASC`,
        [tahun]
      );

      // pendapatan tambahan
      const [pendapatanTambahan] = await connection.query(
        `SELECT 
            MONTH(tanggal) as bulan,
            SUM(jumlah) as total
         FROM pendapatan
         WHERE YEAR(tanggal)=?
         GROUP BY MONTH(tanggal)`,
        [tahun]
      );

      // gabungkan hasil
      const result = {};

      tagihan.forEach((row) => {
        result[row.bulan] = Number(row.total);
      });

      pendapatanTambahan.forEach((row) => {
        result[row.bulan] = (result[row.bulan] || 0) + Number(row.total);
      });

      const data = Object.keys(result).map((bulan) => ({
        bulan: Number(bulan),
        total_pendapatan: result[bulan]
      }));

      const totalTahun = data.reduce((acc, item) => acc + item.total_pendapatan, 0);

      return res.json({
        success: true,
        mode: "TAHUNAN",
        tahun,
        total_tahun: totalTahun,
        data
      });
    }

    // ============================
    // MODE BULANAN
    // ============================

    const [dataTagihan] = await connection.query(
      `SELECT 
          pl.nama,
          pl.kode_pelanggan,
          t.total_tagihan,
          pb.tanggal_bayar
       FROM tagihan t
       JOIN pencatatan_meter p ON t.pencatatan_id=p.id
       JOIN pelanggan pl ON p.pelanggan_id=pl.id
       LEFT JOIN pembayaran pb ON pb.tagihan_id=t.id
       WHERE p.bulan=? AND p.tahun=? 
       AND t.status='lunas'
       ORDER BY pb.tanggal_bayar ASC`,
      [bulan, tahun]
    );

    const [[summaryTagihan]] = await connection.query(
      `SELECT 
          SUM(t.total_tagihan) as total
       FROM tagihan t
       JOIN pencatatan_meter p ON t.pencatatan_id=p.id
       WHERE p.bulan=? AND p.tahun=? 
       AND t.status='lunas'`,
      [bulan, tahun]
    );

    const [[pendapatanTambahan]] = await connection.query(
      `SELECT 
          SUM(jumlah) as total
       FROM pendapatan
       WHERE MONTH(tanggal)=? AND YEAR(tanggal)=?`,
      [bulan, tahun]
    );

    const totalTagihan = Number(summaryTagihan.total) || 0;
    const totalTambahan = Number(pendapatanTambahan.total) || 0;

    const totalBulan = totalTagihan + totalTambahan;

    res.json({
      success: true,
      mode: "BULANAN",
      bulan,
      tahun,

      total_tagihan: totalTagihan,
      total_pendapatan_tambahan: totalTambahan,
      total_bulan: totalBulan,

      total_transaksi: dataTagihan.length,
      data: dataTagihan
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  } finally {
    connection.release();
  }
};

export const laporanTunggakan = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { bulan, tahun, lebih_dari } = req.query;
    const periodDateExpr =
      "STR_TO_DATE(CONCAT(p.tahun,'-',LPAD(p.bulan,2,'0'),'-01'), '%Y-%m-%d')";

    let whereClause = "WHERE t.status='belum_bayar'";
    let whereParams = [];

    if (bulan && tahun && bulan !== "all") {
      // Akumulasi dari awal data sampai periode yang dipilih
      whereClause += `
        AND ${periodDateExpr}
            <= STR_TO_DATE(CONCAT(?, '-', LPAD(?,2,'0'), '-01'), '%Y-%m-%d')
      `;
      whereParams.push(tahun, bulan);
    } else if (tahun) {
      // Jika hanya tahun, akumulasi dari awal data sampai akhir tahun tersebut
      whereClause += " AND p.tahun <= ?";
      whereParams.push(tahun);
    }

    // Filter berdasarkan jumlah tagihan belum bayar per pelanggan
    let havingClause = "";
    const havingParams = [];
    if (lebih_dari) {
      havingClause = `
        HAVING COUNT(t.id) > ?
      `;
      havingParams.push(lebih_dari);
    }

    const groupedQuery = `
      SELECT
          pl.id as pelanggan_id,
          pl.nama,
          pl.kode_pelanggan,
          pl.alamat,
          MOD(MIN(p.tahun * 100 + p.bulan), 100) as bulan,
          FLOOR(MIN(p.tahun * 100 + p.bulan) / 100) as tahun,
          SUM(t.total_tagihan) as total_tagihan,
          COUNT(t.id) as lama_tunggakan
       FROM tagihan t
       JOIN pencatatan_meter p ON t.pencatatan_id=p.id
       JOIN pelanggan pl ON p.pelanggan_id=pl.id
       ${whereClause}
       GROUP BY pl.id, pl.nama, pl.kode_pelanggan, pl.alamat
       ${havingClause}
    `;

    const [data] = await connection.query(
      `${groupedQuery}
       ORDER BY lama_tunggakan DESC, nama ASC`,
      [...whereParams, ...havingParams]
    );

    // ============================
    // SUMMARY
    // ============================
    const [[summary]] = await connection.query(
      `SELECT 
          COUNT(*) as total_pelanggan_menunggak,
          COALESCE(SUM(x.total_tagihan), 0) as total_tunggakan
       FROM (${groupedQuery}) x`,
      [...whereParams, ...havingParams]
    );

    res.json({
      success: true,
      filter: {
        bulan: bulan || null,
        tahun: tahun || null,
        lebih_dari: lebih_dari || null
      },
      summary: {
        total_pelanggan_menunggak: summary.total_pelanggan_menunggak || 0,
        total_tunggakan: summary.total_tunggakan || 0
      },
      total_data: data.length,
      data
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  } finally {
    connection.release();
  }
};

export const laporanLabaRugi = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { bulan, tahun } = req.query;

    // ============================
    // VALIDASI
    // ============================
    if (!tahun) {
      return res.status(400).json({
        message: "tahun wajib diisi"
      });
    }

    let whereAir = "WHERE t.status='lunas' AND p.tahun=?";
    let wherePendapatanTambahan = "WHERE YEAR(tanggal)=?";
    let wherePengeluaran = "WHERE YEAR(tanggal)=?";

    let paramsAir = [tahun];
    let paramsPendapatanTambahan = [tahun];
    let paramsPengeluaran = [tahun];

    if (bulan) {
      whereAir += " AND p.bulan=?";
      wherePendapatanTambahan += " AND MONTH(tanggal)=?";
      wherePengeluaran += " AND MONTH(tanggal)=?";

      paramsAir.push(bulan);
      paramsPendapatanTambahan.push(bulan);
      paramsPengeluaran.push(bulan);
    }

    // ============================
    // PENDAPATAN AIR (TAGIHAN)
    // ============================
    const [[pendapatanAir]] = await connection.query(
      `SELECT 
          COUNT(t.id) as total_transaksi,
          SUM(t.total_tagihan) as total
       FROM tagihan t
       JOIN pencatatan_meter p ON t.pencatatan_id = p.id
       ${whereAir}`,
      paramsAir
    );

    // ============================
    // PENDAPATAN TAMBAHAN
    // ============================
    const [[pendapatanTambahan]] = await connection.query(
      `SELECT
          COUNT(id) as total_transaksi,
          SUM(jumlah) as total
       FROM pendapatan
       ${wherePendapatanTambahan}`,
      paramsPendapatanTambahan
    );

    // ============================
    // PENGELUARAN
    // ============================
    const [[pengeluaran]] = await connection.query(
      `SELECT 
          COUNT(id) as total_transaksi,
          SUM(jumlah) as total
       FROM pengeluaran
       ${wherePengeluaran}`,
      paramsPengeluaran
    );

    const totalAir = Number(pendapatanAir.total) || 0;
    const totalTambahan = Number(pendapatanTambahan.total) || 0;
    const totalPengeluaran = Number(pengeluaran.total) || 0;

    const totalPendapatan = totalAir + totalTambahan;

    const labaRugi = totalPendapatan - totalPengeluaran;

    res.json({
      success: true,
      periode: {
        bulan: bulan || "SEMUA",
        tahun
      },

      pendapatan: {
        air: {
          total_transaksi: pendapatanAir.total_transaksi || 0,
          total: totalAir
        },
        tambahan: {
          total_transaksi: pendapatanTambahan.total_transaksi || 0,
          total: totalTambahan
        },
        total: totalPendapatan
      },

      pengeluaran: {
        total_transaksi: pengeluaran.total_transaksi || 0,
        total: totalPengeluaran
      },

      hasil: {
        laba_rugi: labaRugi,
        status: labaRugi >= 0 ? "LABA" : "RUGI"
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