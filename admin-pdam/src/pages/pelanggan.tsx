import { useEffect, useState } from "react"
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
import * as pelangganService from "../service/pelanggan.service"

type PelangganFormValues = {
  kode_pelanggan: string
  nama: string
  alamat: string
  no_hp: string
  nomor_meter: string
  note: string
  status: string
}

const initialFormValues: PelangganFormValues = {
  kode_pelanggan: "",
  nama: "",
  alamat: "",
  no_hp: "",
  nomor_meter: "",
  note: "",
  status: "aktif",
}

const modalFields: FormModalField[] = [
  { name: "kode_pelanggan", label: "Kode Pelanggan", required: true },
  { name: "nama", label: "Nama", required: true },
  { name: "alamat", label: "Alamat", type: "textarea", required: true },
  { name: "no_hp", label: "No. HP", type: "tel", required: true },
  { name: "nomor_meter", label: "Nomor Meter", required: true },
  { name: "note", label: "Notes", required: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: [
      { label: "Aktif", value: "aktif" },
      { label: "Nonaktif", value: "nonaktif" },
    ],
  },
]

export default function PelangganPage() {
  const [pelanggan, setPelanggan] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formValues, setFormValues] =
    useState<PelangganFormValues>(initialFormValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [resetTargetRow, setResetTargetRow] = useState<any | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  const columns = [
    { header: "Kode Pelanggan", accessor: "kode_pelanggan", sortable: true },
    { header: "Nama", accessor: "nama", sortable: true },
    { header: "Alamat", accessor: "alamat" },
    { header: "No. HP", accessor: "no_hp" },
    { header: "Nomor Meter", accessor: "nomor_meter" },
    { header: "Status", accessor: "status", sortable: true },
    { header: "Notes", accessor: "note" },
  ]

  const fetchPelanggan = async () => {
    try {
      const res = await pelangganService.getPelanggan()
      setPelanggan(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchPelanggan()
  }, [])

  const handleOpenCreate = () => {
    setModalMode("create")
    setSelectedId(null)
    setFormValues(initialFormValues)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (row: any) => {
    setModalMode("edit")
    setSelectedId(row.id)
    setFormValues({
      kode_pelanggan: row.kode_pelanggan ?? "",
      nama: row.nama ?? "",
      alamat: row.alamat ?? "",
      no_hp: row.no_hp ?? "",
      nomor_meter: row.nomor_meter ?? "",
      note: row.note ?? "",
      status: row.status ?? "aktif",
    })
    setIsModalOpen(true)
  }

  const handleFormChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const executeSubmit = async () => {
    try {
      setIsSubmitting(true)

      if (modalMode === "create") {
        await pelangganService.createPelanggan(formValues)
        toast.success("Pelanggan berhasil ditambahkan")
      } else if (selectedId !== null) {
        await pelangganService.updatePelanggan(selectedId, formValues)
        toast.success("Pelanggan berhasil diperbarui")
      }

      setIsModalOpen(false)
      setIsSubmitDialogOpen(false)
      setFormValues(initialFormValues)
      setSelectedId(null)
      fetchPelanggan()
    } catch (err) {
      console.error(err)
      toast.error("Gagal menyimpan data pelanggan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitDialogOpen(true)
  }

  const handleOpenDeleteDialog = (row: any) => {
    setSelectedRow(row)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedRow?.id) return
    try {
      await pelangganService.deletePelanggan(selectedRow.id)
      toast.success(`Pelanggan ${selectedRow.nama} berhasil dihapus`)
      fetchPelanggan()
      setIsDeleteDialogOpen(false)
      setSelectedRow(null)
    } catch (err) {
      console.error(err)
      toast.error("Gagal menghapus pelanggan")
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setSelectedRow(null)
    toast.info("Penghapusan dibatalkan")
  }

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open && isDeleteDialogOpen && selectedRow) {
      setIsDeleteDialogOpen(false)
      setSelectedRow(null)
      toast.info("Penghapusan dibatalkan")
      return
    }

    setIsDeleteDialogOpen(open)
  }

  const handleOpenResetDialog = (row: any) => {
    setResetTargetRow(row)
    setIsResetDialogOpen(true)
  }

  const handleCancelReset = () => {
    setIsResetDialogOpen(false)
    setResetTargetRow(null)
    toast.info("Reset meter dibatalkan")
  }

  const handleConfirmReset = async () => {
    if (!resetTargetRow?.id) return

    try {
      setIsResetting(true)
      const res = await pelangganService.resetMeterPelanggan(resetTargetRow.id)
      toast.success(res?.message || "Meter berhasil direset")
      fetchPelanggan()
      setIsResetDialogOpen(false)
      setResetTargetRow(null)
    } catch (err) {
      console.error(err)
      toast.error("Gagal reset meter pelanggan")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <DataTable
        title="Manajemen Pelanggan"
        columns={columns}
        data={pelanggan}
        onCreate={handleOpenCreate}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDeleteDialog}
        rowActions={[
          {
            label: "Reset Meter",
            onClick: handleOpenResetDialog,
          },
        ]}
      />

      <FormModal
        open={isModalOpen}
        mode={modalMode}
        title={modalMode === "create" ? "Tambah Pelanggan" : "Edit Pelanggan"}
        fields={modalFields}
        values={formValues}
        submitting={isSubmitting}
        onOpenChange={setIsModalOpen}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Apakah kamu yakin ingin menghapus pelanggan{" "}
            <span className="font-semibold text-gray-800">
              {selectedRow?.nama || "-"}
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
              ? "Apakah kamu yakin ingin menambahkan pelanggan ini?"
              : "Apakah kamu yakin ingin menyimpan perubahan pelanggan ini?"}
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

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Reset Meter</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Apakah kamu yakin ingin reset meter pelanggan{" "}
            <span className="font-semibold text-gray-800">
              {resetTargetRow?.nama || "-"}
            </span>
            ?
          </p>
          <DialogFooter>
            <button
              type="button"
              onClick={handleCancelReset}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              disabled={isResetting}
              className="inline-flex h-9 items-center justify-center rounded-md bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResetting ? "Memproses..." : "Ya, Reset"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
