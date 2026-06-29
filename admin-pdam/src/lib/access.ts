const normalizeRole = (role: string | null | undefined) =>
  String(role || "").toLowerCase();

const BENDAHARA_ALLOWED_PATHS = [
  "/dashboard",
  "/pengeluaran",
  "/pendapatan",
  "/laporan/pendapatan",
  "/laporan/laba-rugi",
  "/kas-utama",
  "/kas-konsumen",
];

const READS_BLOCKED_PATHS = ["/users"];

// Paths yang hanya bisa di-CRUD oleh admin dan bendahara
const CRUD_RESTRICTED_PATHS = ["/kas-utama", "/kas-konsumen"];

export const isReadOnlyRole = (role: string | null | undefined) =>
  normalizeRole(role) === "reads";

export const canAccessPath = (
  role: string | null | undefined,
  path: string,
) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin") return true;

  if (normalizedRole === "reads") {
    return !READS_BLOCKED_PATHS.some((blockedPath) =>
      path.startsWith(blockedPath),
    );
  }

  if (normalizedRole === "bendahara") {
    return BENDAHARA_ALLOWED_PATHS.some((allowedPath) =>
      path.startsWith(allowedPath),
    );
  }

  return false;
};

export const canCRUDPath = (
  role: string | null | undefined,
  path: string,
) => {
  const normalizedRole = normalizeRole(role);

  // Admin dan Bendahara bisa CRUD
  if (normalizedRole === "admin" || normalizedRole === "bendahara") {
    return true;
  }

  // Reads role tidak bisa CRUD di restricted paths
  if (normalizedRole === "reads") {
    return !CRUD_RESTRICTED_PATHS.some((restrictedPath) =>
      path.startsWith(restrictedPath),
    );
  }

  return false;
};

export const getDefaultPathByRole = (role: string | null | undefined) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin") return "/dashboard";
  if (normalizedRole === "reads") return "/dashboard";
  if (normalizedRole === "bendahara") return "/dashboard";

  return "/";
};

export const canLoginToWeb = (role: string | null | undefined) => {
  const normalizedRole = normalizeRole(role);
  return (
    normalizedRole === "admin" ||
    normalizedRole === "reads" ||
    normalizedRole === "bendahara"
  );
};
