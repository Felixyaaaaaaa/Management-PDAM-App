import { useEffect, useState } from "react"
import DataTable from "../components/DataTable"
import FormModal, { type FormModalField } from "../components/FormModal"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import {
  getPencatatan,
  generatePencatatan,
  updateMeter,
} from "../service/pencatatan.service"


export default function PencatatanMeterPage() {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"create" | "edit">("create")
  const [selectedRow, setSelectedRow] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  

  const [formValues, setFormValues] = useState<Record<string, string>>({})

  // Load Data
  const fetchData = async () => {
    const res = await getPencatatan()
    setData(res.data || res)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const latestPeriod = data.reduce(
  (latest, item) => {
    if (!latest) return item;

    const currentValue = item.tahun * 100 + item.bulan;
    const latestValue = latest.tahun * 100 + latest.bulan;

    return currentValue > latestValue ? item : latest;
  },
  null as any
)

const canEditRow = (row: any) => {
  if (!latestPeriod) return false;

  const rowValue = row.tahun * 100 + row.bulan;
  const latestValue = latestPeriod.tahun * 100 + latestPeriod.bulan;

  return rowValue === latestValue;
};

  // Columns
  const columns = [
    { header: "Kode", accessor: "kode_pelanggan", sortable: true },
    { header: "Nama", accessor: "nama", sortable: true },
    { header: "Bulan", accessor: "bulan", sortable: true },
    { header: "Tahun", accessor: "tahun", sortable: true },
    { header: "Meter Awal", accessor: "meter_awal" },
    { header: "Meter Akhir", accessor: "meter_akhir" },
    { header: "Pemakaian", accessor: "pemakaian" },
    { header: "Status", accessor: "status", sortable: true },
  ]

  const searchOptions = [
    { label: "Nama", value: "nama" },
    { label: "Kode Pelanggan", value: "kode_pelanggan" },
    { label: "Status", value: "status" },
    { label: "Bulan", value: "bulan" },
    { label: "Tahun", value: "tahun" },
  ]

  const sortOptions = [
    { label: "Bulan", value: "bulan" },
    { label: "Tahun", value: "tahun" },
    { label: "Nama", value: "nama" },
    { label: "Kode Pelanggan", value: "kode_pelanggan" },
    { label: "Status", value: "status" },
  ]

  // Form Fields
  const createFields: FormModalField[] = [
    {
      name: "bulan",
      label: "Bulan",
      type: "number",
      required: true,
    },
    {
      name: "tahun",
      label: "Tahun",
      type: "number",
      required: true,
    },
  ]

  const editFields: FormModalField[] = [
    {
      name: "meter_akhir",
      label: "Meter Akhir",
      type: "number",
      required: true,
    },
  ]

  // Handle Create
  const handleCreate = () => {
    setMode("create")
    setFormValues({
      bulan: "",
      tahun: "",
    })
    setOpen(true)
  }

  // Handle Edit
  const handleEdit = (row: any) => {
    setMode("edit")
    setSelectedRow(row)
    setFormValues({
      meter_akhir: row.meter_akhir?.toString() || "",
    })
    setOpen(true)
  }

  // Handle Submit
  const executeSubmit = async () => {
    setSubmitting(true)

    try {
      if (mode === "create") {
        await generatePencatatan(
          Number(formValues.bulan),
          Number(formValues.tahun)
        )
      } else if (mode === "edit" && selectedRow) {
        await updateMeter(
          selectedRow.id,
          Number(formValues.meter_akhir)
        )
      }

      await fetchData()
      setOpen(false)
      setIsSubmitDialogOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitDialogOpen(true)
  }

  return (
    <>
      <DataTable
        title="Pencatatan Meter"
        columns={columns}
        data={data}
        onCreate={handleCreate}
        onEdit={handleEdit}
        showDelete={false}
        canEditRow={canEditRow}
        searchOptions={searchOptions}
        sortOptions={sortOptions}
        defaultSort={{ key: "tahun", direction: "desc" }}
        periodFilter={{
          enabled: true,
          monthAccessor: "bulan",
          yearAccessor: "tahun",
        }}
      />

      <FormModal
        open={open}
        mode={mode}
        title={
          mode === "create"
            ? "Generate Pencatatan"
            : `Edit Meter Akhir - ${selectedRow?.nama}`
        }
        fields={mode === "create" ? createFields : editFields}
        values={formValues}
        submitting={submitting}
        onOpenChange={setOpen}
        onChange={(name, value) =>
          setFormValues((prev) => ({ ...prev, [name]: value }))
        }
        onSubmit={handleSubmit}
      />

      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Simpan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            {mode === "create"
              ? "Apakah kamu yakin ingin generate pencatatan baru?"
              : "Apakah kamu yakin ingin menyimpan perubahan meter akhir?"}
          </p>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsSubmitDialogOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={executeSubmit}
              disabled={submitting}
              className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Menyimpan..." : "Ya, Simpan"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
