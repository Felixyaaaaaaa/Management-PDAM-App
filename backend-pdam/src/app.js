import express from "express";
console.log('[✓] Express loaded');
import cors from "cors";
console.log('[✓] CORS loaded');

import authRoutes from "./routes/auth.routes.js";
console.log('[✓] Auth routes loaded');
import pelangganRoutes from "./routes/pelanggan.routes.js";
console.log('[✓] Pelanggan routes loaded');
import pencatatanRoutes from "./routes/pencatatan.routes.js";
console.log('[✓] Pencatatan routes loaded');
import tagihanRoutes from "./routes/tagihan.routes.js";
console.log('[✓] Tagihan routes loaded');
import pembayaranRoutes from "./routes/pembayaran.routes.js";
console.log('[✓] Pembayaran routes loaded');
import laporanRoutes from "./routes/laporan.routes.js";
import pengeluaranRoutes from "./routes/pengeluaran.routes.js";
import pendapatanRoutes from "./routes/pendapatan.routes.js";
console.log('[✓] Laporan and Pengeluaran routes loaded');
import kasUtamaRoutes from "./routes/kasUtama.routes.js";
console.log('[✓] Kas Utama routes loaded');
import kasKonsumenRoutes from "./routes/kasKonsumen.routes.js";
console.log('[✓] Kas Konsumen routes loaded');
const app = express();


app.use(cors());
app.use(express.json());
console.log('[✓] Middleware loaded (CORS, JSON parser)');

app.use("/api/auth", authRoutes);
app.use("/api/pelanggan", pelangganRoutes);
app.use("/api/pencatatan", pencatatanRoutes);
app.use("/api/tagihan", tagihanRoutes);
app.use("/api/pembayaran", pembayaranRoutes);
app.use("/api/pengeluaran", pengeluaranRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/pendapatan", pendapatanRoutes);
app.use("/api/kas-utama", kasUtamaRoutes);
app.use("/api/kas-konsumen", kasKonsumenRoutes);
console.log('[✓] All routes registered');

export default app;
