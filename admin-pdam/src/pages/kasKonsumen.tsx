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
import { useAuth } from "../hooks/useAuth"
import { canCRUDPath } from "../lib/access"
import * as kasKonsumenService from "../service/kasKonsumen.service"

type KasKonsumenRow = {
  id: number
  tanggal: string
  jenis: "masuk" | "keluar"
  kategori: string
  deskripsi: string
  jumlah: number
  created_by_nama?: string
  created_at?: string
}

type KasKonsumenFormValues = {
  tanggal: string
  jenis: "masuk" | "keluar"
  kategori: string
  deskripsi: string
  jumlah: string
}

const initialFormValues: KasKonsumenFormValues = {
  tanggal: "",
  jenis: "masuk",
  kategori: "",
  deskripsi: "",
  jumlah: "",
}

const modalFields: FormModalField[] = [
  { name: "tanggal", label: "Tanggal", type: "date", required: true },
  {
    name: "jenis",
    label: "Jenis",
    type: "select",
    options: [
      { value: "masuk", label: "Masuk" },
      { value: "keluar", label: "Keluar" },
    ],
    required: true,
  },
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value)
}

export default function KasKonsumenPage() {
  const { user } = useAuth()
  const canCRUD = canCRUDPath(user?.role, "/kas-konsumen")
  
  const [rows, setRows] = useState<KasKonsumenRow[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedRow, setSelectedRow] = useState<KasKonsumenRow | null>(null)
  const [formValues, setFormValues] =
    useState<KasKonsumenFormValues>(initialFormValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  const columns = useMemo(
    () => [
      { header: "Tanggal", accessor: "tanggal", sortable: true },
      {
        header: "Jenis",
        accessor: "jenis",
        sortable: true,
        render: (value: string) =>
          value === "masuk" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Pemasukan
            </span>
          ) : value === "keluar" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Pengeluaran
            </span>
          ) : (
            "-"
          ),
      },
      { header: "Kategori", accessor: "kategori", sortable: true },
      { header: "Deskripsi", accessor: "deskripsi" },
      {
        header: "Jumlah",
        accessor: "jumlah",
        sortable: true,
        render: (value: number, row: KasKonsumenRow) =>
          row.jenis === "masuk" ? (
            <span className="font-semibold text-emerald-600">
              +{formatCurrency(value)}
            </span>
          ) : row.jenis === "keluar" ? (
            <span className="font-semibold text-red-600">
              -{formatCurrency(value)}
            </span>
          ) : (
            formatCurrency(value)
          ),
      },
      { header: "Dibuat Oleh", accessor: "created_by_nama" },
    ],
    [],
  )

  const searchOptions = useMemo(
    () => [
      { label: "Tanggal", value: "tanggal" },
      { label: "Jenis", value: "jenis" },
      { label: "Kategori", value: "kategori" },
      { label: "Deskripsi", value: "deskripsi" },
    ],
    [],
  )

  const sortOptions = useMemo(
    () => [
      { label: "Tanggal", value: "tanggal" },
      { label: "Jenis", value: "jenis" },
      { label: "Kategori", value: "kategori" },
      { label: "Jumlah", value: "jumlah" },
    ],
    [],
  )

  const fetchData = async () => {
    try {
      const response = await kasKonsumenService.getKasKonsumen()
      const normalizedRows = (response?.data || []).map((item: any) => ({
        ...item,
        tanggal: formatDateInputJakarta(item.tanggal),
        jumlah: Number(item.jumlah) || 0,
      }))
      setRows(normalizedRows)
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat data kas konsumen")
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

  const handleOpenEdit = (row: KasKonsumenRow) => {
    setModalMode("edit")
    setSelectedId(row.id)
    setFormValues({
      tanggal: row.tanggal || "",
      jenis: row.jenis || "masuk",
      kategori: row.kategori || "",
      deskripsi: row.deskripsi || "",
      jumlah: String(row.jumlah ?? ""),
    })
    setIsModalOpen(true)
  }

  const handleOpenDeleteDialog = (row: KasKonsumenRow) => {
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
        jenis: formValues.jenis,
        kategori: formValues.kategori,
        deskripsi: formValues.deskripsi,
        jumlah: parsedJumlah,
      }

      if (modalMode === "create") {
        await kasKonsumenService.createKasKonsumen(payload)
        toast.success("Kas Konsumen berhasil ditambahkan")
      } else if (selectedId !== null) {
        await kasKonsumenService.updateKasKonsumen(selectedId, payload)
        toast.success("Kas Konsumen berhasil diperbarui")
      }

      setIsModalOpen(false)
      setIsSubmitDialogOpen(false)
      setFormValues(initialFormValues)
      setSelectedId(null)
      await fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Gagal menyimpan kas konsumen")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedRow?.id) return

    try {
      await kasKonsumenService.deleteKasKonsumen(selectedRow.id)
      toast.success("Kas Konsumen berhasil dihapus")
      setIsDeleteDialogOpen(false)
      setSelectedRow(null)
      await fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Gagal menghapus kas konsumen")
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
        title="Manajemen Kas Konsumen"
        columns={columns}
        data={rows}
        onCreate={canCRUD ? handleOpenCreate : undefined}
        onEdit={canCRUD ? handleOpenEdit : undefined}
        onDelete={canCRUD ? handleOpenDeleteDialog : undefined}
        searchOptions={searchOptions}
        sortOptions={sortOptions}
      />

      <FormModal
        open={isModalOpen}
        mode={modalMode}
        title={modalMode === "create" ? "Tambah Kas Konsumen" : "Edit Kas Konsumen"}
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
            Apakah kamu yakin ingin menghapus kas konsumen kategori{" "}
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
              ? "Apakah kamu yakin ingin menambahkan kas konsumen ini?"
              : "Apakah kamu yakin ingin menyimpan perubahan kas konsumen ini?"}
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
