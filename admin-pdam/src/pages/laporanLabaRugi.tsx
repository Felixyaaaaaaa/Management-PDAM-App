import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import DataTable from "../components/DataTable"
import { getLaporanLabaRugi } from "../service/laporan.service"

type LabaRugiResponse = {
  periode?: {
    bulan?: string
    tahun?: string
  }
  pendapatan?: {
    air?: {
      total_transaksi?: number
      total?: number
    }
    tambahan?: {
      total_transaksi?: number
      total?: number
    }
    total?: number
  }
  pengeluaran?: {
    total_transaksi?: number
    total?: number
  }
  hasil?: {
    laba_rugi?: number
    status?: string
  }
}

type LabaRugiRow = {
  komponen: string
  total_transaksi: number | string
  total: number
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

const formatCurrency = (value: number) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`

export default function LaporanLabaRugiPage() {
  const now = new Date()
  const [bulan, setBulan] = useState("all")
  const [tahun, setTahun] = useState(String(now.getFullYear()))
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<LabaRugiResponse>({})

  const pendapatanAirTransaksi = Number(data.pendapatan?.air?.total_transaksi || 0)
  const pendapatanTambahanTransaksi = Number(
    data.pendapatan?.tambahan?.total_transaksi || 0,
  )
  const pendapatanAirTotal = Number(data.pendapatan?.air?.total || 0)
  const pendapatanTambahanTotal = Number(data.pendapatan?.tambahan?.total || 0)
  const pendapatanTotal = Number(data.pendapatan?.total || 0)
  const pengeluaranTransaksi = Number(data.pengeluaran?.total_transaksi || 0)
  const pengeluaranTotal = Number(data.pengeluaran?.total || 0)
  const labaRugi = Number(data.hasil?.laba_rugi || 0)
  const statusHasil = String(data.hasil?.status || "LABA")
  const selisihAbsolut = Math.abs(labaRugi)
  const maxComparison = Math.max(pendapatanTotal, pengeluaranTotal, 1)
  const pendapatanBarWidth =
    pendapatanTotal > 0
      ? Math.max((pendapatanTotal / maxComparison) * 100, 8)
      : 0
  const pengeluaranBarWidth =
    pengeluaranTotal > 0
      ? Math.max((pengeluaranTotal / maxComparison) * 100, 8)
      : 0
  const rasioBebanPersen =
    pendapatanTotal > 0 ? (pengeluaranTotal / pendapatanTotal) * 100 : 0

  const tableRows = useMemo<LabaRugiRow[]>(
    () => [
      {
        komponen: "Pendapatan Air",
        total_transaksi: pendapatanAirTransaksi,
        total: pendapatanAirTotal,
      },
      {
        komponen: "Pendapatan Tambahan",
        total_transaksi: pendapatanTambahanTransaksi,
        total: pendapatanTambahanTotal,
      },
      {
        komponen: "Total Pendapatan",
        total_transaksi: pendapatanAirTransaksi + pendapatanTambahanTransaksi,
        total: pendapatanTotal,
      },
      {
        komponen: "Pengeluaran",
        total_transaksi: pengeluaranTransaksi,
        total: pengeluaranTotal,
      },
      {
        komponen: `Hasil (${statusHasil})`,
        total_transaksi: "-",
        total: labaRugi,
      },
    ],
    [
      labaRugi,
      pendapatanAirTotal,
      pendapatanAirTransaksi,
      pendapatanTambahanTotal,
      pendapatanTambahanTransaksi,
      pendapatanTotal,
      pengeluaranTotal,
      pengeluaranTransaksi,
      statusHasil,
    ],
  )

  const columns = useMemo(
    () => [
      { header: "Komponen", accessor: "komponen", sortable: true },
      { header: "Total Transaksi", accessor: "total_transaksi", sortable: true },
      { header: "Total", accessor: "total", sortable: true },
    ],
    [],
  )

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await getLaporanLabaRugi({
        tahun,
        ...(bulan !== "all" ? { bulan } : {}),
      })
      setData(response || {})
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat laporan laba rugi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const periodeMonth = String(data.periode?.bulan || bulan)
  const periodeYear = String(data.periode?.tahun || tahun)
  const normalizedPeriodeMonth = periodeMonth.toUpperCase()
  const periodeText =
    normalizedPeriodeMonth === "ALL" || normalizedPeriodeMonth === "SEMUA"
      ? `Semua Bulan ${periodeYear}`
      : `${
          monthOptions.find((item) => item.value === periodeMonth)?.label ||
          periodeMonth
        } ${periodeYear}`

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Periode" value={periodeText} />
        <SummaryCard
          label="Pendapatan Air"
          value={formatCurrency(pendapatanAirTotal)}
        />
        <SummaryCard
          label="Pendapatan Tambahan"
          value={formatCurrency(pendapatanTambahanTotal)}
        />
        <SummaryCard
          label="Total Pendapatan"
          value={formatCurrency(pendapatanTotal)}
        />
        <SummaryCard
          label="Pengeluaran"
          value={formatCurrency(pengeluaranTotal)}
        />
        <SummaryCard
          label={`Hasil (${statusHasil})`}
          value={formatCurrency(labaRugi)}
          highlight={
            statusHasil.toUpperCase() === "RUGI" ? "danger" : "success"
          }
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={bulan}
            onChange={(event) => setBulan(event.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
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
            placeholder="Tahun"
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          />

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Memuat..." : "Tampilkan"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 xl:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Perbandingan Keuangan
          </h3>
          <div className="mt-4 space-y-4">
            <ComparisonBar
              label="Pendapatan"
              value={pendapatanTotal}
              width={pendapatanBarWidth}
              color="bg-emerald-500"
              textColor="text-emerald-700"
            />
            <ComparisonBar
              label="Pengeluaran"
              value={pengeluaranTotal}
              width={pengeluaranBarWidth}
              color="bg-rose-500"
              textColor="text-rose-700"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Analisis Cepat
          </h3>
          <div className="mt-4 space-y-3">
            <QuickStat
              label={
                labaRugi >= 0 ? "Surplus Pendapatan" : "Defisit Pendapatan"
              }
              value={formatCurrency(selisihAbsolut)}
              valueClass={labaRugi >= 0 ? "text-emerald-600" : "text-rose-600"}
            />
            <QuickStat
              label="Rasio Beban"
              value={`${rasioBebanPersen.toFixed(1)}% dari pendapatan`}
              valueClass={
                rasioBebanPersen > 100
                  ? "text-rose-600"
                  : rasioBebanPersen > 80
                    ? "text-amber-600"
                    : "text-emerald-600"
              }
            />
            <QuickStat
              label="Status"
              value={statusHasil}
              valueClass={statusHasil.toUpperCase() === "RUGI" ? "text-rose-600" : "text-emerald-600"}
            />
          </div>
        </div>
      </div>

      <DataTable
        title="Laporan Laba Rugi"
        columns={columns}
        data={tableRows}
        showCreateButton={false}
        showEdit={false}
        showDelete={false}
        searchOptions={[
          { label: "Komponen", value: "komponen" },
          { label: "Total", value: "total" },
        ]}
        sortOptions={[
          { label: "Komponen", value: "komponen" },
          { label: "Total Transaksi", value: "total_transaksi" },
          { label: "Total", value: "total" },
        ]}
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: "success" | "danger"
}) {
  const valueColor =
    highlight === "danger"
      ? "text-red-600"
      : highlight === "success"
        ? "text-emerald-600"
        : "text-gray-900"

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-2 text-xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}

function ComparisonBar({
  label,
  value,
  width,
  color,
  textColor,
}: {
  label: string
  value: number
  width: number
  color: string
  textColor: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-semibold ${textColor}`}>{formatCurrency(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(width, 100)}%` }}
        />
      </div>
    </div>
  )
}

function QuickStat({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-gray-900 ${valueClass || ""}`}>
        {value}
      </p>
    </div>
  )
}
