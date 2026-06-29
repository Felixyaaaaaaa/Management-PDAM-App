import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import DataTable from "../components/DataTable"
import FormModal, { type FormModalField } from "../components/FormModal"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { getTagihan, updateTagihan } from "../service/tagihan.service"
import { bayarTagihan } from "../service/pembayaran.service"

type TagihanRow = {
  id: number
  kode_pelanggan: string
  nama: string
  bulan: number | string
  tahun: number | string
  pemakaian: number
  total_tagihan: number
  status: string
}

type EditFormValues = {
  total_tagihan: string
}

type PaymentFormValues = {
  metode: string
}

const initialEditValues: EditFormValues = {
  total_tagihan: "",
}

const initialPaymentValues: PaymentFormValues = {
  metode: "Cash",
}

const editFields: FormModalField[] = [
  {
    name: "total_tagihan",
    label: "Total Tagihan",
    type: "number",
    required: true,
  },
]

const paymentFields: FormModalField[] = [
  {
    name: "metode",
    label: "Metode Pembayaran",
    type: "select",
    required: true,
    options: [
      { label: "Cash", value: "Cash" },
      { label: "Transfer", value: "Transfer" },
    ],
  },
]

const isLunas = (status: string | undefined) =>
  String(status ?? "").toLowerCase() === "lunas"

export default function TagihanPage() {
  const [data, setData] = useState<TagihanRow[]>([])
  const [selectedRow, setSelectedRow] = useState<TagihanRow | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [editValues, setEditValues] = useState<EditFormValues>(initialEditValues)
  const [paymentValues, setPaymentValues] =
    useState<PaymentFormValues>(initialPaymentValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmAction, setConfirmAction] = useState<"edit" | "payment" | null>(
    null,
  )

  const columns = useMemo(
    () => [
      { header: "Kode", accessor: "kode_pelanggan", sortable: true },
      { header: "Nama", accessor: "nama", sortable: true },
      { header: "Bulan", accessor: "bulan", sortable: true },
      { header: "Tahun", accessor: "tahun", sortable: true },
      { header: "Pemakaian", accessor: "pemakaian", sortable: true },
      { header: "Total", accessor: "total_tagihan", sortable: true },
      { header: "Status", accessor: "status", sortable: true },
    ],
    [],
  )

  const searchOptions = useMemo(
    () => [
      { label: "Kode Pelanggan", value: "kode_pelanggan" },
      { label: "Nama", value: "nama" },
      { label: "Status", value: "status" },
      { label: "Bulan", value: "bulan" },
      { label: "Tahun", value: "tahun" },
    ],
    [],
  )

  const sortOptions = useMemo(
    () => [
      { label: "Bulan", value: "bulan" },
      { label: "Tahun", value: "tahun" },
      { label: "Nama", value: "nama" },
      { label: "Kode Pelanggan", value: "kode_pelanggan" },
      { label: "Status", value: "status" },
      { label: "Total", value: "total_tagihan" },
    ],
    [],
  )

  const fetchData = async () => {
    try {
      const result = await getTagihan()
      setData(result || [])
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat data tagihan")
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenEdit = (row: TagihanRow) => {
    setSelectedRow(row)
    setEditValues({ total_tagihan: String(row.total_tagihan ?? "") })
    setIsEditOpen(true)
  }

  const handleOpenPayment = (row: TagihanRow) => {
    setSelectedRow(row)
    setPaymentValues(initialPaymentValues)
    setIsPaymentOpen(true)
  }

  const executeSubmitEdit = async () => {
    if (!selectedRow) return

    const parsedTotal = Number(editValues.total_tagihan)
    if (!Number.isFinite(parsedTotal) || parsedTotal < 0) {
      toast.error("Total tagihan tidak valid")
      return
    }

    try {
      setIsSubmitting(true)
      await updateTagihan(selectedRow.id, parsedTotal)
      toast.success("Tagihan berhasil diperbarui")
      setIsEditOpen(false)
      setConfirmAction(null)
      setSelectedRow(null)
      setEditValues(initialEditValues)
      await fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Gagal memperbarui tagihan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const executeSubmitPayment = async () => {
    if (!selectedRow) return

    try {
      setIsSubmitting(true)
      await bayarTagihan(
        selectedRow.id,
        Number(selectedRow.total_tagihan),
        paymentValues.metode,
      )
      toast.success("Pembayaran tagihan berhasil")
      setIsPaymentOpen(false)
      setConfirmAction(null)
      setSelectedRow(null)
      setPaymentValues(initialPaymentValues)
      await fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Gagal melakukan pembayaran tagihan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEdit = async () => {
    setConfirmAction("edit")
  }

  const handleSubmitPayment = async () => {
    setConfirmAction("payment")
  }

  const handleConfirmAction = async () => {
    if (confirmAction === "edit") {
      await executeSubmitEdit()
      return
    }

    if (confirmAction === "payment") {
      await executeSubmitPayment()
      return
    }
  }

  return (
    <>
      <DataTable
        title="Data Tagihan"
        columns={columns}
        data={data}
        showCreateButton={false}
        showEdit
        showDelete
        editLabel="Edit"
        deleteLabel="Bayar"
        onEdit={handleOpenEdit}
        onDelete={handleOpenPayment}
        canEditRow={(row) => !isLunas(row.status)}
        canDeleteRow={(row) => !isLunas(row.status)}
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
        open={isEditOpen}
        mode="edit"
        title={`Edit Total Tagihan - ${selectedRow?.nama ?? ""}`}
        fields={editFields}
        values={editValues}
        submitting={isSubmitting}
        onOpenChange={setIsEditOpen}
        onChange={(name, value) =>
          setEditValues((prev) => ({ ...prev, [name]: value }))
        }
        onSubmit={handleSubmitEdit}
      />

      <FormModal
        open={isPaymentOpen}
        mode="edit"
        title={`Pembayaran Tagihan - ${selectedRow?.nama ?? ""}`}
        fields={paymentFields}
        values={paymentValues}
        submitting={isSubmitting}
        onOpenChange={setIsPaymentOpen}
        onChange={(name, value) =>
          setPaymentValues((prev) => ({ ...prev, [name]: value }))
        }
        onSubmit={handleSubmitPayment}
      />

      <Dialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "payment"
                ? "Konfirmasi Pembayaran"
                : "Konfirmasi Simpan"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            {confirmAction === "payment"
              ? "Apakah kamu yakin ingin memproses pembayaran tagihan ini?"
              : "Apakah kamu yakin ingin menyimpan perubahan total tagihan ini?"}
          </p>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmAction}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Memproses..."
                : confirmAction === "payment"
                  ? "Ya, Bayar"
                  : "Ya, Simpan"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
