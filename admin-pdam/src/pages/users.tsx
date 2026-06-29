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
import * as userService from "../service/user.service"

type UserFormValues = {
  name: string
  email: string
  role: string
  password: string
}

const initialFormValues: UserFormValues = {
  name: "",
  email: "",
  role: "petugas",
  password: "",
}

const createFields: FormModalField[] = [
  { name: "name", label: "Nama", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "role",
    label: "Role",
    type: "select",
    required: true,
    options: [
      { label: "Petugas", value: "petugas" },
      { label: "Admin", value: "admin" },
      { label: "Reads", value: "reads" },
      { label: "Bendahara", value: "bendahara" },
    ],
  },
  { name: "password", label: "Password", type: "password", required: true },
]

const editFields: FormModalField[] = [
  { name: "name", label: "Nama", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "role",
    label: "Role",
    type: "select",
    required: true,
    options: [
      { label: "Petugas", value: "petugas" },
      { label: "Admin", value: "admin" },
      { label: "Reads", value: "reads" },
    ],
  },
  {
    name: "password",
    label: "Password Baru (opsional)",
    type: "password",
    placeholder: "Kosongkan jika tidak diubah",
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formValues, setFormValues] = useState<UserFormValues>(initialFormValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  const columns = [
    { header: "Nama", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Role", accessor: "role" },
  ]

  const fetchUsers = async () => {
    try {
      const res = await userService.getUsers()
      // backend returns { success, total_data, data }
      setUsers(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchUsers()
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
      name: row.name ?? "",
      email: row.email ?? "",
      role: row.role ?? "petugas",
      password: "",
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
        await userService.createUser({
          name: formValues.name,
          email: formValues.email,
          role: formValues.role,
          password: formValues.password,
        })
        toast.success("User berhasil ditambahkan")
      } else if (selectedId !== null) {
        const updatePayload: {
          name: string
          email: string
          role: string
          password?: string
        } = {
          name: formValues.name,
          email: formValues.email,
          role: formValues.role,
        }

        if (formValues.password.trim()) {
          updatePayload.password = formValues.password
        }

        await userService.updateUser(selectedId, updatePayload)
        toast.success("User berhasil diperbarui")
      }

      setIsModalOpen(false)
      setIsSubmitDialogOpen(false)
      setFormValues(initialFormValues)
      setSelectedId(null)
      fetchUsers()
    } catch (err) {
      console.error(err)
      toast.error("Gagal menyimpan data user")
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
      await userService.deleteUser(selectedRow.id)
      toast.success(`User ${selectedRow.name} berhasil dihapus`)
      fetchUsers()
      setIsDeleteDialogOpen(false)
      setSelectedRow(null)
    } catch (err) {
      console.error(err)
      toast.error("Gagal menghapus user")
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

  return (
    <>
      <DataTable
        title="Manajemen Users"
        columns={columns}
        data={users}
        onCreate={handleOpenCreate}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDeleteDialog}
      />

      <FormModal
        open={isModalOpen}
        mode={modalMode}
        title={modalMode === "create" ? "Tambah User" : "Edit User"}
        fields={modalMode === "create" ? createFields : editFields}
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
            Apakah kamu yakin ingin menghapus user{" "}
            <span className="font-semibold text-gray-800">
              {selectedRow?.name || "-"}
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
              ? "Apakah kamu yakin ingin menambahkan user ini?"
              : "Apakah kamu yakin ingin menyimpan perubahan user ini?"}
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
