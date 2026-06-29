import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "../src/routes/router";
import { AuthProvider } from "../src/context/AuthContext";
import { Toaster } from "sonner";
import "./index.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <RouterProvider router={router} />
    <Toaster position="top-right" richColors />
  </AuthProvider>
);
