import { FaEdit, FaTrash } from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = "Sin registros",
  emptyDescription = "No hay datos para mostrar",
  onEdit = null,
  onDelete = null,
  renderRow = null,
}) {
  if (loading) {
    return <LoadingSpinner text="Cargando datos..." />;
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700 uppercase text-sm font-semibold">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-4 py-3 text-center">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id || idx}
              className="border-b hover:bg-gray-50 transition"
            >
              {renderRow ? (
                renderRow(row)
              ) : (
                <>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </>
              )}

              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-center flex gap-2 justify-center">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                      title="Eliminar"
                    >
                      <FaTrash />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
