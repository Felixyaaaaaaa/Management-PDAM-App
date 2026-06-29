import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getLaporanDashboard } from "../service/laporan.service"
import { useAuth } from "../hooks/useAuth"

type DashboardSummary = {
  total_pelanggan: number | string
  total_tagihan: number | string
  total_nominal: number | string
  total_lunas: number | string
  total_belum_bayar: number | string
  total_pendapatan_tagihan: number | string
  total_pendapatan_tambahan: number | string
  total_pendapatan: number | string
  total_tunggakan: number | string
  total_pengeluaran: number | string
  laba_rugi: number | string
  status_keuangan: string
}

const monthOptions = [
  { label: "Semua Bulan", value: "all" },
  { label: "Januari", value: "1" },
  { label: "Februari", value: "2" },
  { label: "Maret", value: "3" },
  { label: "April", value: "4" },
  { label: "Mei", value: "5" },
  { label: "Juni", value: "6" },
  { label: "Juli", value: "7" },
  { label: "Agustus", value: "8" },
  { label: "September", value: "9" },
  { label: "Oktober", value: "10" },
  { label: "November", value: "11" },
  { label: "Desember", value: "12" },
]

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrency = (value: unknown) =>
  `Rp ${toNumber(value).toLocaleString("id-ID")}`

const initialSummary: DashboardSummary = {
  total_pelanggan: 0,
  total_tagihan: 0,
  total_nominal: 0,
  total_lunas: 0,
  total_belum_bayar: 0,
  total_pendapatan_tagihan: 0,
  total_pendapatan_tambahan: 0,
  total_pendapatan: 0,
  total_tunggakan: 0,
  total_pengeluaran: 0,
  laba_rugi: 0,
  status_keuangan: "LABA",
}

export default function Dashboard() {
  const { user } = useAuth()
  const role = String(user?.role || "").toLowerCase()
  const isBendahara = role === "bendahara"
  const now = new Date()
  const [bulan, setBulan] = useState("all")
  const [tahun, setTahun] = useState(String(now.getFullYear()))
  const [usePeriod, setUsePeriod] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<DashboardSummary>(initialSummary)
  const [filterLabel, setFilterLabel] = useState("SEMUA DATA")

  const fetchDashboard = async (withPeriod: boolean) => {
    try {
      setLoading(true)
      const params = withPeriod
        ? {
            tahun,
            ...(bulan !== "all" ? { bulan } : {}),
          }
        : undefined
      const response = await getLaporanDashboard(
        params,
      )
      setSummary(response.data || initialSummary)
      const nextFilterLabel =
        typeof response.filter === "string"
          ? response.filter
          : response.filter?.tahun
            ? String(response.filter?.bulan || "").toUpperCase() === "SEMUA"
              ? `Tahun ${response.filter?.tahun}`
              : `${response.filter?.bulan}/${response.filter?.tahun}`
            : "SEMUA DATA"
      setFilterLabel(nextFilterLabel)
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat data dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard(false)
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">
              Ringkasan tagihan, pendapatan, pengeluaran, dan posisi laba rugi.
            </p>
            <span className="inline-flex rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              Filter: {filterLabel}
            </span>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Status Keuangan
            </p>
            <p
              className={`mt-2 text-xl font-bold ${
                String(summary.status_keuangan).toUpperCase() === "RUGI"
                  ? "text-red-600"
                  : "text-emerald-600"
              }`}
            >
              {String(summary.status_keuangan || "LABA")}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Laba Rugi: {formatCurrency(summary.laba_rugi)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3">
            <input
              type="checkbox"
              checked={usePeriod}
              onChange={(event) => setUsePeriod(event.target.checked)}
            />
            <span className="text-sm text-gray-700">Gunakan Periode</span>
          </label>

          <select
            value={bulan}
            onChange={(event) => setBulan(event.target.value)}
            disabled={!usePeriod}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm disabled:bg-gray-100 disabled:text-gray-400"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={tahun}
            onChange={(event) => setTahun(event.target.value)}
            disabled={!usePeriod}
            placeholder="Tahun"
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm disabled:bg-gray-100 disabled:text-gray-400"
          />

          <button
            type="button"
            onClick={() => fetchDashboard(usePeriod)}
            disabled={loading}
            className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Memuat..." : "Tampilkan"}
          </button>

          <button
            type="button"
            onClick={() => {
              setUsePeriod(false)
              fetchDashboard(false)
            }}
            disabled={loading}
            className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </div>

      {isBendahara ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Pendapatan Tagihan"
            value={formatCurrency(summary.total_pendapatan_tagihan)}
            tone="success"
          />
          <SummaryCard
            label="Pendapatan Tambahan"
            value={formatCurrency(summary.total_pendapatan_tambahan)}
            tone="success"
          />
          <SummaryCard
            label="Total Pendapatan"
            value={formatCurrency(summary.total_pendapatan)}
            tone="success"
          />
          <SummaryCard
            label="Total Pengeluaran"
            value={formatCurrency(summary.total_pengeluaran)}
            tone="danger"
          />
          <SummaryCard
            label="Laba Rugi"
            value={formatCurrency(summary.laba_rugi)}
            tone={
              String(summary.status_keuangan).toUpperCase() === "RUGI"
                ? "danger"
                : "success"
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Pelanggan Aktif"
            value={String(summary.total_pelanggan)}
          />
          <SummaryCard
            label="Total Tagihan"
            value={String(summary.total_tagihan)}
          />
          <SummaryCard
            label="Total Nominal Tagihan"
            value={formatCurrency(summary.total_nominal)}
          />
          <SummaryCard
            label="Total Tagihan Lunas"
            value={String(summary.total_lunas)}
          />
          <SummaryCard
            label="Total Belum Bayar"
            value={String(summary.total_belum_bayar)}
          />
          <SummaryCard
            label="Pendapatan Tagihan"
            value={formatCurrency(summary.total_pendapatan_tagihan)}
            tone="success"
          />
          <SummaryCard
            label="Pendapatan Tambahan"
            value={formatCurrency(summary.total_pendapatan_tambahan)}
            tone="success"
          />
          <SummaryCard
            label="Total Pendapatan"
            value={formatCurrency(summary.total_pendapatan)}
            tone="success"
          />
          <SummaryCard
            label="Total Pengeluaran"
            value={formatCurrency(summary.total_pengeluaran)}
            tone="danger"
          />
          <SummaryCard
            label="Total Tunggakan"
            value={formatCurrency(summary.total_tunggakan)}
          />
        </div>
      )}
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
