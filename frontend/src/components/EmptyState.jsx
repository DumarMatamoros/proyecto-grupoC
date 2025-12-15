import { FaInbox } from "react-icons/fa";

export default function EmptyState({
  icon: Icon = FaInbox,
  title = "Sin registros",
  description = "No hay datos para mostrar",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Icon className="text-5xl text-gray-300 mb-4" />
      <p className="text-lg font-semibold text-gray-600">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
