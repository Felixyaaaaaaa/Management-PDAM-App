import type { FormEvent } from "react"
import { FileText } from "lucide-react"
import { Calendar } from "primereact/calendar"
import type { FormEvent as PrimeFormEvent } from "primereact/ts-helpers"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Input } from "./ui/input"

type FieldType =
  | "text"
  | "number"
  | "date"
  | "email"
  | "tel"
  | "password"
  | "textarea"
  | "select"

interface SelectOption {
  label: string
  value: string
}

export interface FormModalField {
  name: string
  label: string
  type?: FieldType
  placeholder?: string
  required?: boolean
  options?: SelectOption[]
}

interface FormModalProps {
  open: boolean
  mode: "create" | "edit"
  title: string
  fields: FormModalField[]
  values: Record<string, string>
  submitting?: boolean
  onOpenChange: (open: boolean) => void
  onChange: (name: string, value: string) => void
  onSubmit: () => void | Promise<void>
}

const parseDateValue = (value: string): Date | null => {
  if (!value) return null
  const [year, month, day] = value.split("-").map((item) => Number(item))
  if (!year || !month || !day) return null

  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const formatDateValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const normalizeCalendarValue = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value

  if (Array.isArray(value)) {
    const firstValue = value[0]
    if (firstValue instanceof Date && !Number.isNaN(firstValue.getTime())) {
      return firstValue
    }
    return null
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  return null
}

export default function FormModal({
  open,
  mode,
  title,
  fields,
  values,
  submitting = false,
  onOpenChange,
  onChange,
  onSubmit,
}: FormModalProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 p-0 shadow-xl sm:max-w-2xl">
        <DialogHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-5">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <FileText className="h-5 w-5" />
            </span>
            {title}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  value={values[field.name] ?? ""}
                  placeholder={field.placeholder}
                  required={field.required}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  className="min-h-24 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition-all duration-150 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100"
                />
              ) : field.type === "select" ? (
                <select
                  value={values[field.name] ?? ""}
                  required={field.required}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 text-sm text-gray-800 outline-none transition-all duration-150 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100"
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "date" ? (
                <Calendar
                  value={parseDateValue(values[field.name] ?? "")}
                  dateFormat="yy-mm-dd"
                  placeholder={field.placeholder ?? "yyyy-mm-dd"}
                  appendTo="self"
                  showIcon
                  inputClassName="h-10 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 text-sm text-gray-800 outline-none transition-all duration-150 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  className="w-full [&_.p-button]:h-10 [&_.p-button]:w-12 [&_.p-button]:rounded-r-xl [&_.p-button]:border [&_.p-button]:border-gray-300 [&_.p-button]:bg-blue-500 [&_.p-button]:text-white hover:[&_.p-button]:bg-blue-600"
                  onChange={(
                    event: PrimeFormEvent<Date | Date[] | (Date | null)[]>,
                  ) => {
                    const selectedDate = normalizeCalendarValue(event.value)
                    if (selectedDate) {
                      onChange(field.name, formatDateValue(selectedDate))
                      return
                    }
                    onChange(field.name, "")
                  }}
                  required={field.required}
                />
              ) : (
                <Input
                  type={field.type ?? "text"}
                  value={values[field.name] ?? ""}
                  placeholder={field.placeholder}
                  required={field.required}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  className="h-10 rounded-xl border-gray-300 bg-gray-50 text-gray-800 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100"
                />
              )}
            </div>
          ))}

          <DialogFooter className="border-t border-gray-200 pt-5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition-all duration-150 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 text-sm font-semibold text-white transition-all duration-150 hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Menyimpan..." : mode === "create" ? "Tambah" : "Simpan"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
