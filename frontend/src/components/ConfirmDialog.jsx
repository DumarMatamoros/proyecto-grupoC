import { FaExclamationTriangle } from "react-icons/fa";

export default function ConfirmDialog({
  isOpen = false,
  title = "Confirmación",
  message = "¿Está seguro de que desea continuar?",
  onConfirm,
  onCancel,
  isLoading = false,
  confirmText = "Eliminar",
  confirmLabel, // alias for confirmText
  confirmingText = "Eliminando...",
  cancelText = "Cancelar",
  confirmColor = "red",
}) {
  // Don't render if not open
  if (!isOpen) return null;

  const confirmColorClasses = {
    red: "bg-red-600 hover:bg-red-700",
    yellow: "bg-yellow-600 hover:bg-yellow-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
  };

  // Use confirmLabel as alias if provided
  const buttonText = confirmLabel || confirmText;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[100]" 
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      onClick={!isLoading ? onCancel : undefined}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <FaExclamationTriangle className="text-2xl text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 ${confirmColorClasses[confirmColor] || confirmColorClasses.red} text-white rounded-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition`}
          >
            {isLoading ? confirmingText : buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
