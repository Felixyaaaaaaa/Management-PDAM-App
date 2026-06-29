import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import DataTable from "../components/DataTable"
import { getLaporanPendapatan } from "../service/laporan.service"

type PendapatanTahunanRow = {
  bulan: number
  total_pendapatan: number
}

type PendapatanBulananRow = {
  nama: string
  kode_pelanggan: string
  total_tagihan: number
  tanggal_bayar: string
}

const monthOptions = [
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

export default function LaporanPendapatanPage() {
  const now = new Date()
  const [tahun, setTahun] = useState(String(now.getFullYear()))
  const [bulan, setBulan] = useState(String(now.getMonth() + 1))
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"TAHUNAN" | "BULANAN">("BULANAN")
  const [data, setData] = useState<Array<PendapatanTahunanRow | PendapatanBulananRow>>(
    [],
  )
  const [total, setTotal] = useState(0)
  const [totalTagihan, setTotalTagihan] = useState(0)
  const [totalPendapatanTambahan, setTotalPendapatanTambahan] = useState(0)
  const [totalTransaksi, setTotalTransaksi] = useState(0)

  const columns = useMemo(() => {
    if (mode === "TAHUNAN") {
      return [
        { header: "Bulan", accessor: "bulan", sortable: true },
        { header: "Total Pendapatan", accessor: "total_pendapatan", sortable: true },
      ]
    }

    return [
      { header: "Kode", accessor: "kode_pelanggan", sortable: true },
      { header: "Nama", accessor: "nama", sortable: true },
      { header: "Total Tagihan", accessor: "total_tagihan", sortable: true },
      { header: "Tanggal Bayar", accessor: "tanggal_bayar", sortable: true },
    ]
  }, [mode])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await getLaporanPendapatan({
        tahun,
        mode: mode.toLowerCase() as "bulanan" | "tahunan",
        ...(mode === "BULANAN" ? { bulan } : {}),
      })

      const normalizedMode = String(response.mode || mode).toUpperCase()
      const isBulanan = normalizedMode === "BULANAN"

      setData(response.data || [])
      setTotal(Number(response.total_bulan || response.total_tahun || 0))
      setTotalTagihan(isBulanan ? Number(response.total_tagihan || 0) : 0)
      setTotalPendapatanTambahan(
        isBulanan ? Number(response.total_pendapatan_tambahan || 0) : 0,
      )
      setTotalTransaksi(isBulanan ? Number(response.total_transaksi || 0) : 0)
    } catch (error) {
      console.error(error)
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response!
              .data!.message!
          : "Gagal memuat laporan pendapatan"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Mode Laporan" value={mode} />
        <SummaryCard label="Total Pendapatan" value={formatCurrency(total)} />
        <SummaryCard
          label="Pendapatan Tagihan"
          value={mode === "BULANAN" ? formatCurrency(totalTagihan) : "-"}
        />
        <SummaryCard
          label="Pendapatan Tambahan"
          value={mode === "BULANAN" ? formatCurrency(totalPendapatanTambahan) : "-"}
        />
        <SummaryCard
          label="Total Transaksi"
          value={mode === "BULANAN" ? totalTransaksi.toString() : "-"}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as "TAHUNAN" | "BULANAN")}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          >
            <option value="BULANAN">Mode Bulanan</option>
            <option value="TAHUNAN">Mode Tahunan</option>
          </select>

          <input
            type="number"
            value={tahun}
            onChange={(event) => setTahun(event.target.value)}
            placeholder="Tahun"
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          />

          {mode === "BULANAN" ? (
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
          ) : (
            <div className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 flex items-center">
              Semua bulan (otomatis)
            </div>
          )}

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

      <DataTable
        title="Laporan Pendapatan"
        columns={columns}
        data={data}
        showCreateButton={false}
        showEdit={false}
        showDelete={false}
        searchOptions={
          mode === "TAHUNAN"
            ? [{ label: "Bulan", value: "bulan" }]
            : [
                { label: "Kode", value: "kode_pelanggan" },
                { label: "Nama", value: "nama" },
              ]
        }
        sortOptions={
          mode === "TAHUNAN"
            ? [
                { label: "Bulan", value: "bulan" },
                { label: "Total Pendapatan", value: "total_pendapatan" },
              ]
            : [
                { label: "Kode", value: "kode_pelanggan" },
                { label: "Nama", value: "nama" },
                { label: "Total Tagihan", value: "total_tagihan" },
                { label: "Tanggal Bayar", value: "tanggal_bayar" },
              ]
        }
      />
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
