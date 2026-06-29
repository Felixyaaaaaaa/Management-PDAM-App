import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/login";
import Dashboard from "../pages/dashboard";
import ProtectedRoute from "../routes/ProtectedRoute";
import AdminLayout from "../layouts/MainLayout";
import Users from "../pages/users";
import PencatatanMeter from "../pages/pencatatanMeter";
import Pelanggan from "../pages/pelanggan";
import Tagihan from "../pages/tagihan";
import Pengeluaran from "../pages/pengeluaran";
import Pendapatan from "../pages/pendapatan";
import KasUtama from "../pages/kasUtama";
import KasUtamaDashboard from "../pages/kasUtamaDashboard";
import KasKonsumen from "../pages/kasKonsumen";
import KasKonsumenDashboard from "../pages/kasKonsumenDashboard";
import LaporanTagihan from "../pages/laporanTagihan";
import LaporanPendapatan from "../pages/laporanPendapatan";
import LaporanTunggakan from "../pages/laporanTunggakan";
import LaporanLabaRugi from "../pages/laporanLabaRugi";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/users",
        element: <Users />,
      },
      {
        path: "/pencatatan-meter",
        element: <PencatatanMeter />,
      },
      {
        path: "/pelanggan",
        element: <Pelanggan />,
      },
      {
        path: "/tagihan",
        element: <Tagihan />,
      },
      {
        path: "/pengeluaran",
        element: <Pengeluaran />,
      },
      {
        path: "/pendapatan",
        element: <Pendapatan />,
      },
      {
        path: "/kas-utama",
        element: <KasUtama />,
      },
      {
        path: "/kas-utama/dashboard",
        element: <KasUtamaDashboard />,
      },
      {
        path: "/kas-konsumen",
        element: <KasKonsumen />,
      },
      {
        path: "/kas-konsumen/dashboard",
        element: <KasKonsumenDashboard />,
      },
      {
        path: "/laporan/tagihan",
        element: <LaporanTagihan />,
      },
      {
        path: "/laporan/pendapatan",
        element: <LaporanPendapatan />,
      },
      {
        path: "/laporan/tunggakan",
        element: <LaporanTunggakan />,
      },
      {
        path: "/laporan/laba-rugi",
        element: <LaporanLabaRugi />,
      },
    ],
  },
]);
