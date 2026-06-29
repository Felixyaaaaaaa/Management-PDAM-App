import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DataTable from "../components/DataTable";
import { getLaporanTagihan } from "../service/laporan.service";

type LaporanTagihanRow = {
  nama: string;
  kode_pelanggan: string;
  alamat: string;
  meter_awal: number;
  meter_akhir: number;
  pemakaian: number;
  total_tagihan: number | string;
  status: string;
  biaya_beban: number;
  biaya_pemakaian_rp: number;
};

type LaporanTagihanSummary = {
  total_data: number;
  total_nominal: number | string;
  total_lunas: number | string;
  total_belum_bayar: number | string;
  total_pendapatan: number | string;
  biaya_beban_flat: number | string;
};

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
];

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: unknown) =>
  `Rp ${toNumber(value).toLocaleString("id-ID")}`;

const formatCurrencyReceipt = (value: unknown) =>
  toNumber(value).toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatOptionalCurrencyReceipt = (value: unknown) => {
  const numeric = toNumber(value);
  if (numeric <= 0) return "-";
  return formatCurrencyReceipt(numeric);
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export default function LaporanTagihanPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [status, setStatus] = useState("SEMUA");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LaporanTagihanRow[]>([]);
  const [summary, setSummary] = useState<LaporanTagihanSummary>({
    total_data: 0,
    total_nominal: 0,
    total_lunas: 0,
    total_belum_bayar: 0,
    total_pendapatan: 0,
    biaya_beban_flat: 0,
  });

  const columns = useMemo(
    () => [
      { header: "Kode", accessor: "kode_pelanggan", sortable: true },
      { header: "Nama", accessor: "nama", sortable: true },
      { header: "Alamat", accessor: "alamat" },
      { header: "Meter Awal", accessor: "meter_awal", sortable: true },
      { header: "Meter Akhir", accessor: "meter_akhir", sortable: true },
      { header: "Pemakaian", accessor: "pemakaian", sortable: true },
      { header: "Biaya Beban", accessor: "biaya_beban", sortable: true },
      {
        header: "Biaya Pemakaian",
        accessor: "biaya_pemakaian_rp",
        sortable: true,
      },
      { header: "Total Tagihan", accessor: "total_tagihan", sortable: true },
      { header: "Status", accessor: "status", sortable: true },
    ],
    [],
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getLaporanTagihan({
        bulan,
        tahun,
        ...(status !== "SEMUA" ? { status } : {}),
      });
      const normalizedRows = (response.data || []).map(
        (item: LaporanTagihanRow) => ({
          ...item,
          meter_awal: toNumber(item.meter_awal),
          meter_akhir: toNumber(item.meter_akhir),
          pemakaian: toNumber(item.pemakaian),
          total_tagihan: toNumber(item.total_tagihan),
          biaya_beban: toNumber(item.biaya_beban),
          biaya_pemakaian_rp: toNumber(item.biaya_pemakaian_rp),
        }),
      );
      setRows(normalizedRows);
      setSummary(
        response.summary || {
          total_data: 0,
          total_nominal: 0,
          total_lunas: 0,
          total_belum_bayar: 0,
          total_pendapatan: 0,
          biaya_beban_flat: 0,
        },
      );
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat laporan tagihan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportKwitansi = (exportRows: LaporanTagihanRow[]) => {
    const monthLabel =
      monthOptions.find((option) => option.value === bulan)?.label || bulan;
    const periodLabel = `${monthLabel} ${tahun}`;

    const receiptRowsHtml = exportRows
      .map((row) => {
        const nama = escapeHtml(row.nama || "-");
        const kode = escapeHtml(row.kode_pelanggan || "-");
        const totalTagihan = formatCurrencyReceipt(row.total_tagihan);
        const biayaBeban = formatCurrencyReceipt(row.biaya_beban);
        const biayaPemakaian = formatOptionalCurrencyReceipt(
          row.biaya_pemakaian_rp,
        );
        const pemakaian = toNumber(row.pemakaian).toLocaleString("id-ID");
        const meterAwal = toNumber(row.meter_awal).toLocaleString("id-ID");
        const meterAkhir = toNumber(row.meter_akhir).toLocaleString("id-ID");

        return `
          <tr>
            <td style="padding: 0;">
              <table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-family: Calibri, Arial, sans-serif; font-size: 24px; border-bottom: 1px solid #000;">
                <tr>
                <tr>
                  <td style="width: 49%; vertical-align: top; padding: 8px 10px 12px 6px;">
                    <div style="font-size: 38px; line-height: 1.1; text-align: left; font-weight: 700;">SUMUR DALAM RW 07</div>
                    <div style="margin-top: 2px; border-top: 1px solid #000;"></div>
                    <div style="margin-top: 4px; font-size: 36px;">${escapeHtml(periodLabel)}</div>
                    <table style="width: 100%; margin-top: 14px; border-collapse: collapse; font-size: 39px;">
                      <tr><td style="padding: 1px 0; width: 38%;">ID PEL</td><td style="width: 7%;">:</td><td>${kode}</td></tr>
                      <tr><td style="padding: 1px 0;">NAMA</td><td>:</td><td>${nama}</td></tr>
                      <tr><td style="padding: 1px 0;">Pemakaian</td><td>:</td><td>${pemakaian}</td></tr>
                    </table>
                    <table style="width: 100%; margin-top: 16px; border-collapse: collapse; font-size: 41px;">
                      <tr>
                        <td style="width: 38%; font-weight: 700;">Tot.Tagih</td>
                        <td style="width: 7%; font-weight: 700;">:</td>
                        <td style="font-weight: 700;">${totalTagihan}</td>
                      </tr>
                    </table>
                  </td>
                  <td></td>
                  <td style="width: 2%; border-left: 2px dashed #000;"></td>
                  <td style="width: 49%; vertical-align: top; padding: 8px 6px 12px 16px;">
                    <div style="font-size: 38px; line-height: 1.1; text-align: center; font-weight: 700;">SUMUR DALAM RW 07</div>
                    <div style="margin-top: 2px; border-top: 1px solid #000;"></div>
                    <div style="margin-top: 4px; font-size: 36px;">Bulan&nbsp;&nbsp;${escapeHtml(periodLabel)}</div>
                    <table style="width: 100%; margin-top: 14px; border-collapse: collapse; font-size: 39px;">
                      <tr>
                        <td style="padding: 1px 0; width: 22%;">ID PEL</td><td style="width: 5%;">:</td><td style="width: 24%;">${kode}</td>
                        <td style="width: 22%;"></td><td style="width: 5%;"></td><td style="width: 22%;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 1px 0;">NAMA</td><td>:</td><td>${nama}</td>
                        <td>Biaya Beban</td><td>:</td><td>${biayaBeban}</td>
                      </tr>
                      <tr>
                        <td style="padding: 1px 0;">Meter Awal</td><td>:</td><td>${meterAwal}</td>
                        <td>Biaya Pemakaian</td><td>:</td><td>${biayaPemakaian}</td>
                      </tr>
                      <tr>
                        <td style="padding: 1px 0;">Meter Akhir</td><td>:</td><td>${meterAkhir}</td>
                        <td></td><td></td><td></td>
                      </tr>
                      <tr>
                        <td style="padding: 1px 0;">Pemakaian</td><td>:</td><td>${pemakaian}</td>
                        <td style="font-weight: 700;">Total Tagihan</td><td style="font-weight: 700;">:</td><td style="font-weight: 700;">${totalTagihan}</td>
                      </tr>
                    <tr></tr>

                    </table>
                  </td>
                </tr></tr>
              </table>
            </td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
            <tbody>
              <tr>
                <td style="width: 5%;"></td>
                <td style="width: 95%;">
                  <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                    <tbody>${receiptRowsHtml}</tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kwitansi_tagihan_${bulan}_${tahun}.xls`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Total Data" value={summary.total_data.toString()} />
        <SummaryCard
          label="Total Nominal"
          value={formatCurrency(summary.total_nominal)}
        />
        <SummaryCard
          label="Total Lunas"
          value={summary.total_lunas.toString()}
        />
        <SummaryCard
          label="Belum Bayar"
          value={summary.total_belum_bayar.toString()}
        />
        <SummaryCard
          label="Pendapatan"
          value={formatCurrency(summary.total_pendapatan)}
        />
        <SummaryCard
          label="Biaya Beban Flat"
          value={formatCurrency(summary.biaya_beban_flat)}
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

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="lunas">Lunas</option>
            <option value="belum_bayar">Belum Bayar</option>
          </select>

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
        title="Laporan Tagihan"
        columns={columns}
        data={rows}
        showCreateButton={false}
        showEdit={false}
        showDelete={false}
        searchOptions={[
          { label: "Kode", value: "kode_pelanggan" },
          { label: "Nama", value: "nama" },
          { label: "Alamat", value: "alamat" },
          { label: "Status", value: "status" },
        ]}
        sortOptions={[
          { label: "Kode", value: "kode_pelanggan" },
          { label: "Nama", value: "nama" },
          { label: "Pemakaian", value: "pemakaian" },
          { label: "Biaya Beban", value: "biaya_beban" },
          { label: "Biaya Pemakaian", value: "biaya_pemakaian_rp" },
          { label: "Total Tagihan", value: "total_tagihan" },
          { label: "Status", value: "status" },
        ]}
        exportButtonLabel="Export Excel Kwitansi"
        onExportExcel={(exportRows) =>
          handleExportKwitansi(exportRows as LaporanTagihanRow[])
        }
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
