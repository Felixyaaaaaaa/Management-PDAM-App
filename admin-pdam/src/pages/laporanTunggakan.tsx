import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import DataTable from "../components/DataTable"
import { getLaporanTunggakan } from "../service/laporan.service"

type LaporanTunggakanRow = {
  nama: string
  kode_pelanggan: string
  alamat: string
  bulan: number
  tahun: number
  total_tagihan: number
  lama_tunggakan: number
}

type LaporanTunggakanSummary = {
  total_pelanggan_menunggak: number
  total_tunggakan: number
}

type LaporanTunggakanFilter = {
  bulan: string | null
  tahun: string | null
  lebih_dari: string | null
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

const buildFilterDescription = (filter: LaporanTunggakanFilter) => {
  const monthLabel =
    filter.bulan && filter.bulan !== "all"
      ? monthOptions.find((item) => item.value === String(filter.bulan))?.label
      : null
  const periode = filter.tahun
    ? monthLabel
      ? `Periode: sampai ${monthLabel} ${filter.tahun}`
      : `Periode: semua bulan tahun ${filter.tahun}`
    : "Periode: semua data"

  const lama = filter.lebih_dari
    ? `, tunggakan lebih dari ${filter.lebih_dari} bulan`
    : ""

  return `${periode}${lama}`
}

export default function LaporanTunggakanPage() {
  const now = new Date()
  const [bulan, setBulan] = useState("all")
  const [tahun, setTahun] = useState(String(now.getFullYear()))
  const [lebihDari, setLebihDari] = useState("")
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<LaporanTunggakanRow[]>([])
  const [summary, setSummary] = useState<LaporanTunggakanSummary>({
    total_pelanggan_menunggak: 0,
    total_tunggakan: 0,
  })
  const [filterInfo, setFilterInfo] = useState<LaporanTunggakanFilter>({
    bulan: null,
    tahun: String(now.getFullYear()),
    lebih_dari: null,
  })

  const columns = useMemo(
    () => [
      { header: "Kode", accessor: "kode_pelanggan", sortable: true },
      { header: "Nama", accessor: "nama", sortable: true },
      { header: "Alamat", accessor: "alamat" },
      { header: "Bulan", accessor: "bulan", sortable: true },
      { header: "Tahun", accessor: "tahun", sortable: true },
      { header: "Total Tagihan", accessor: "total_tagihan", sortable: true },
      { header: "Lama Tunggakan (bulan)", accessor: "lama_tunggakan", sortable: true },
    ],
    [],
  )

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await getLaporanTunggakan({
        ...(bulan !== "all" ? { bulan } : {}),
        ...(tahun ? { tahun } : {}),
        ...(lebihDari ? { lebih_dari: lebihDari } : {}),
      })

      setRows(response.data || [])
      setSummary(
        response.summary || {
          total_pelanggan_menunggak: 0,
          total_tunggakan: 0,
        },
      )
      setFilterInfo(
        response.filter || {
          bulan: bulan !== "all" ? bulan : null,
          tahun: tahun || null,
          lebih_dari: lebihDari || null,
        },
      )
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat laporan tunggakan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard
          label="Pelanggan Menunggak"
          value={summary.total_pelanggan_menunggak.toString()}
        />
        <SummaryCard
          label="Total Tunggakan"
          value={formatCurrency(summary.total_tunggakan)}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={bulan}
            onChange={(event) => setBulan(event.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value === "all" ? "Semua Bulan (1 Tahun)" : `Sampai ${option.label}`}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={tahun}
            onChange={(event) => setTahun(event.target.value)}
            placeholder="Tahun acuan"
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          />

          <input
            type="number"
            value={lebihDari}
            onChange={(event) => setLebihDari(event.target.value)}
            placeholder="Min. lama tunggakan (bulan)"
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
        <p className="mt-3 text-xs text-gray-500">
          {buildFilterDescription(filterInfo)}
        </p>
      </div>

      <DataTable
        title="Laporan Tunggakan"
        columns={columns}
        data={rows}
        showCreateButton={false}
        showEdit={false}
        showDelete={false}
        searchOptions={[
          { label: "Kode", value: "kode_pelanggan" },
          { label: "Nama", value: "nama" },
          { label: "Bulan", value: "bulan" },
          { label: "Tahun", value: "tahun" },
        ]}
        sortOptions={[
          { label: "Kode", value: "kode_pelanggan" },
          { label: "Nama", value: "nama" },
          { label: "Bulan", value: "bulan" },
          { label: "Tahun", value: "tahun" },
          { label: "Total Tagihan", value: "total_tagihan" },
          { label: "Lama Tunggakan", value: "lama_tunggakan" },
        ]}
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
