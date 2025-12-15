import { useContext } from "react";
import { ToastContext } from "../components/ToastProvider";

export default function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }

  const { addToast } = context;

  return {
    success: (message, duration = 4000) => addToast(message, "success", duration),
    error: (message, duration = 4000) => addToast(message, "error", duration),
    warning: (message, duration = 4000) => addToast(message, "warning", duration),
    info: (message, duration = 4000) => addToast(message, "info", duration),
  };
}
