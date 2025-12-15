import { FaSpinner } from "react-icons/fa";

export default function LoadingSpinner({ text = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <FaSpinner className="text-4xl text-blue-600 animate-spin" />
      <p className="mt-4 text-gray-600 font-medium">{text}</p>
    </div>
  );
}
