import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from "react-icons/fa";

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems = 0,
  itemsPerPage = 20,
  showItemsInfo = true 
}) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => onPageChange(1);
  const handleLast = () => onPageChange(totalPages);

  // Calcular rango de items mostrados
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      {/* Info de items (estilo Gmail) */}
      {showItemsInfo && totalItems > 0 && (
        <div className="text-sm text-gray-600 order-2 sm:order-1">
          <span className="font-medium">{startItem}-{endItem}</span>
          <span className="text-gray-400"> de </span>
          <span className="font-medium">{totalItems}</span>
        </div>
      )}

      {/* Controles de paginación */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Primera página */}
        <button
          onClick={handleFirst}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Primera página"
        >
          <FaAngleDoubleLeft size={14} />
        </button>

        {/* Anterior */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Página anterior"
        >
          <FaChevronLeft size={14} />
        </button>

        {/* Indicador de página actual */}
        <div className="flex items-center gap-2 px-3">
          <span className="text-sm text-gray-600">Página</span>
          <select
            value={currentPage}
            onChange={(e) => onPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">de {totalPages}</span>
        </div>

        {/* Siguiente */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Página siguiente"
        >
          <FaChevronRight size={14} />
        </button>

        {/* Última página */}
        <button
          onClick={handleLast}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Última página"
        >
          <FaAngleDoubleRight size={14} />
        </button>
      </div>
    </div>
  );
}
