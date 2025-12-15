import { useContext } from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";
import { ToastContext } from "./ToastProvider";

export default function ToastNotification() {
  const { toasts, removeToast } = useContext(ToastContext);

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="text-green-500 text-xl" />;
      case "error":
        return <FaExclamationCircle className="text-red-500 text-xl" />;
      case "warning":
        return <FaExclamationCircle className="text-yellow-500 text-xl" />;
      case "info":
      default:
        return <FaInfoCircle className="text-blue-500 text-xl" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-l-4 border-green-500";
      case "error":
        return "bg-red-50 border-l-4 border-red-500";
      case "warning":
        return "bg-yellow-50 border-l-4 border-yellow-500";
      case "info":
      default:
        return "bg-blue-50 border-l-4 border-blue-500";
    }
  };

  const getTextColor = (type) => {
    switch (type) {
      case "success":
        return "text-green-700";
      case "error":
        return "text-red-700";
      case "warning":
        return "text-yellow-700";
      case "info":
      default:
        return "text-blue-700";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-4 p-4 rounded-lg shadow-lg ${getBgColor(
            toast.type
          )} animate-slideIn`}
        >
          {getIcon(toast.type)}
          <p className={`flex-1 font-medium ${getTextColor(toast.type)}`}>
            {toast.message}
          </p>
          <button
            onClick={() => removeToast(toast.id)}
            className={`text-lg hover:opacity-70 transition ${getTextColor(toast.type)}`}
          >
            <FaTimes />
          </button>
        </div>
      ))}
    </div>
  );
}
