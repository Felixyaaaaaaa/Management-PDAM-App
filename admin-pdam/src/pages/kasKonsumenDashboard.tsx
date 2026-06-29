import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getKasKonsumenDashboard } from "../service/kasKonsumen.service"

type DashboardSummary = {
  total_transaksi: number
  total_masuk: number
  total_keluar: number
  saldo_kas: number
  laba_rugi: number
  status_keuangan: string
}

type RecentTransaction = {
  id: number
  tanggal: string
  jenis: "masuk" | "keluar"
  kategori: string
  deskripsi: string
  jumlah: string
  created_by_nama: string
}

type KategoriTotal = {
  kategori: string
  total: string
}

type DashboardData = {
  filter: string
  summary: DashboardSummary
  recent_transaction: RecentTransaction[]
  pengeluaran_terbesar: KategoriTotal[]
  pemasukan_terbesar: KategoriTotal[]
}

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrency = (value: unknown) =>
  `Rp ${toNumber(value).toLocaleString("id-ID")}`

const formatDateDisplay = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

const initialSummary: DashboardSummary = {
  total_transaksi: 0,
  total_masuk: 0,
  total_keluar: 0,
  saldo_kas: 0,
  laba_rugi: 0,
  status_keuangan: "LABA",
}

const initialData: DashboardData = {
  filter: "SEMUA DATA",
  summary: initialSummary,
  recent_transaction: [],
  pengeluaran_terbesar: [],
  pemasukan_terbesar: [],
}

export default function KasKonsumenDashboard() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DashboardData>(initialData)

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const response = await getKasKonsumenDashboard()
      setData(response || initialData)
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat data dashboard kas konsumen")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Kas Konsumen</h1>
            <p className="text-sm text-gray-600">
              Ringkasan pemasukan, pengeluaran, saldo kas, dan posisi laba rugi.
            </p>
            <span className="inline-flex rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              Filter: {data.filter}
            </span>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Status Keuangan
            </p>
            <p
              className={`mt-2 text-xl font-bold ${
                String(data.summary.status_keuangan).toUpperCase() === "RUGI"
                  ? "text-red-600"
                  : "text-emerald-600"
              }`}
            >
              {String(data.summary.status_keuangan || "LABA")}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Laba Rugi: {formatCurrency(data.summary.laba_rugi)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => fetchDashboard()}
            disabled={loading}
            className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          label="Total Transaksi"
          value={String(data.summary.total_transaksi)}
        />
        <SummaryCard
          label="Total Pemasukan"
          value={formatCurrency(data.summary.total_masuk)}
          tone="success"
        />
        <SummaryCard
          label="Total Pengeluaran"
          value={formatCurrency(data.summary.total_keluar)}
          tone="danger"
        />
        <SummaryCard
          label="Saldo Kas"
          value={formatCurrency(data.summary.saldo_kas)}
          tone="success"
        />
        <SummaryCard
          label="Laba Rugi"
          value={formatCurrency(data.summary.laba_rugi)}
          tone={
            String(data.summary.status_keuangan).toUpperCase() === "RUGI"
              ? "danger"
              : "success"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Transaksi Terbaru
          </h2>
          {data.recent_transaction.length > 0 ? (
            <div className="space-y-3">
              {data.recent_transaction.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {transaction.kategori}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          transaction.jenis === "masuk"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {transaction.jenis === "masuk" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {transaction.deskripsi}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDateDisplay(transaction.tanggal)} • {transaction.created_by_nama}
                    </p>
                  </div>
                  <div
                    className={`text-right text-sm font-semibold ${
                      transaction.jenis === "masuk"
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.jenis === "masuk" ? "+" : "-"}
                    {formatCurrency(transaction.jumlah)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Tidak ada transaksi</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Pengeluaran Terbesar
            </h2>
            {data.pengeluaran_terbesar.length > 0 ? (
              <div className="space-y-3">
                {data.pengeluaran_terbesar.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {item.kategori}
                    </span>
                    <span className="text-sm font-semibold text-red-600">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Tidak ada data pengeluaran</p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Pemasukan Terbesar
            </h2>
            {data.pemasukan_terbesar.length > 0 ? (
              <div className="space-y-3">
                {data.pemasukan_terbesar.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {item.kategori}
                    </span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Tidak ada data pemasukan</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "success" | "danger"
}) {
  const valueColor =
    tone === "success"
      ? "text-emerald-600"
      : tone === "danger"
        ? "text-red-600"
        : "text-gray-900"

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}
