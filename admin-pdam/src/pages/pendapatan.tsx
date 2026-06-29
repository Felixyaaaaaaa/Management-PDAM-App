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
import * as pendapatanService from "../service/pendapatan.service"

type PendapatanRow = {
  id: number
  tanggal: string
  kategori: string
  deskripsi: string
  jumlah: number
  created_at?: string
}

type PendapatanFormValues = {
  tanggal: string
  kategori: string
  deskripsi: string
  jumlah: string
}

const initialFormValues: PendapatanFormValues = {
  tanggal: "",
  kategori: "",
  deskripsi: "",
  jumlah: "",
}

const modalFields: FormModalField[] = [
  { name: "tanggal", label: "Tanggal", type: "date", required: true },
  { name: "kategori", label: "Kategori", required: true },
  { name: "deskripsi", label: "Deskripsi", type: "textarea", required: true },
  { name: "jumlah", label: "Jumlah", type: "number", required: true },
]

const formatDateInputJakarta = (value: unknown) => {
  if (!value) return ""
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return ""

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const year = parts.find((part) => part.type === "year")?.value ?? ""
  const month = parts.find((part) => part.type === "month")?.value ?? ""
  const day = parts.find((part) => part.type === "day")?.value ?? ""

  if (!year || !month || !day) return ""
  return `${year}-${month}-${day}`
}

export default function PendapatanPage() {
  const [rows, setRows] = useState<PendapatanRow[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedRow, setSelectedRow] = useState<PendapatanRow | null>(null)
  const [formValues, setFormValues] =
    useState<PendapatanFormValues>(initialFormValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  const columns = useMemo(
    () => [
      { header: "Tanggal", accessor: "tanggal", sortable: true },
      { header: "Kategori", accessor: "kategori", sortable: true },
      { header: "Deskripsi", accessor: "deskripsi" },
      { header: "Jumlah", accessor: "jumlah", sortable: true },
    ],
    [],
  )

  const searchOptions = useMemo(
    () => [
      { label: "Tanggal", value: "tanggal" },
      { label: "Kategori", value: "kategori" },
      { label: "Deskripsi", value: "deskripsi" },
    ],
    [],
  )

  const sortOptions = useMemo(
    () => [
      { label: "Tanggal", value: "tanggal" },
      { label: "Kategori", value: "kategori" },
      { label: "Jumlah", value: "jumlah" },
    ],
    [],
  )

  const fetchData = async () => {
    try {
      const response = await pendapatanService.getPendapatan()
      const normalizedRows = (response?.data || []).map((item: any) => ({
        ...item,
        tanggal: formatDateInputJakarta(item.tanggal),
        jumlah: Number(item.jumlah) || 0,
      }))
      setRows(normalizedRows)
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat data pendapatan")
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreate = () => {
    setModalMode("create")
    setSelectedId(null)
    setFormValues(initialFormValues)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (row: PendapatanRow) => {
    setModalMode("edit")
    setSelectedId(row.id)
    setFormValues({
      tanggal: row.tanggal || "",
      kategori: row.kategori || "",
      deskripsi: row.deskripsi || "",
      jumlah: String(row.jumlah ?? ""),
    })
    setIsModalOpen(true)
  }

  const handleOpenDeleteDialog = (row: PendapatanRow) => {
    setSelectedRow(row)
    setIsDeleteDialogOpen(true)
  }

  const handleFormChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const executeSubmit = async () => {
    const parsedJumlah = Number(formValues.jumlah)
    if (!Number.isFinite(parsedJumlah) || parsedJumlah < 0) {
      toast.error("Jumlah tidak valid")
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        tanggal: formValues.tanggal,
        kategori: formValues.kategori,
        deskripsi: formValues.deskripsi,
        jumlah: parsedJumlah,
      }

      if (modalMode === "create") {
        await pendapatanService.createPendapatan(payload)
        toast.success("Pendapatan berhasil ditambahkan")
      } else if (selectedId !== null) {
        await pendapatanService.updatePendapatan(selectedId, payload)
        toast.success("Pendapatan berhasil diperbarui")
      }

      setIsModalOpen(false)
      setIsSubmitDialogOpen(false)
      setFormValues(initialFormValues)
      setSelectedId(null)
      await fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Gagal menyimpan pendapatan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedRow?.id) return

    try {
      await pendapatanService.deletePendapatan(selectedRow.id)
      toast.success("Pendapatan berhasil dihapus")
      setIsDeleteDialogOpen(false)
      setSelectedRow(null)
      await fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Gagal menghapus pendapatan")
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setSelectedRow(null)
    toast.info("Penghapusan dibatalkan")
  }

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open && isDeleteDialogOpen && selectedRow) {
      handleCancelDelete()
      return
    }

    setIsDeleteDialogOpen(open)
  }

  return (
    <>
      <DataTable
        title="Manajemen Pendapatan"
        columns={columns}
        data={rows}
        onCreate={handleOpenCreate}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDeleteDialog}
        searchOptions={searchOptions}
        sortOptions={sortOptions}
      />

      <FormModal
        open={isModalOpen}
        mode={modalMode}
        title={modalMode === "create" ? "Tambah Pendapatan" : "Edit Pendapatan"}
        fields={modalFields}
        values={formValues}
        submitting={isSubmitting}
        onOpenChange={setIsModalOpen}
        onChange={handleFormChange}
        onSubmit={() => setIsSubmitDialogOpen(true)}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Apakah kamu yakin ingin menghapus pendapatan kategori{" "}
            <span className="font-semibold text-gray-800">
              {selectedRow?.kategori || "-"}
            </span>
            ?
          </p>
          <DialogFooter>
            <button
              type="button"
              onClick={handleCancelDelete}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Tidak
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
            >
              Ya, Hapus
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Simpan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            {modalMode === "create"
              ? "Apakah kamu yakin ingin menambahkan pendapatan ini?"
              : "Apakah kamu yakin ingin menyimpan perubahan pendapatan ini?"}
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
              disabled={isSubmitting}
              className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Menyimpan..." : "Ya, Simpan"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
