import { FaExclamationTriangle } from "react-icons/fa";

export default function ConfirmDialog({
  title = "Confirmación",
  message = "¿Está seguro de que desea continuar?",
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaExclamationTriangle className="text-2xl text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
