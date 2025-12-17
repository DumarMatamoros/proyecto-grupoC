import { useState, useRef, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";

// Componente para celdas con texto truncado y tooltip
function TruncatedCell({ value }) {
  const cellRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Verificar overflow cuando cambia el valor o el tamaño del contenedor
  useEffect(() => {
    const checkOverflow = () => {
      if (cellRef.current) {
        setIsOverflowing(cellRef.current.scrollWidth > cellRef.current.clientWidth);
      }
    };
    
    checkOverflow();
    
    // Observer para detectar cambios de tamaño
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (cellRef.current) {
      resizeObserver.observe(cellRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [value]);

  const handleMouseEnter = (e) => {
    // Re-verificar overflow al hacer hover
    if (cellRef.current) {
      const overflowing = cellRef.current.scrollWidth > cellRef.current.clientWidth;
      setIsOverflowing(overflowing);
      
      if (overflowing) {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPosition({
          top: rect.top - 8,
          left: rect.left + rect.width / 2,
        });
        setShowTooltip(true);
      }
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <div className="relative w-full">
      <div
        ref={cellRef}
        className="truncate cursor-default w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {value}
      </div>
      {showTooltip && (
        <div
          className="fixed z-[9999] px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg max-w-xs break-words transform -translate-x-1/2 -translate-y-full"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {value}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

// Componente principal DataTable
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyIcon = null,
  emptyTitle = "Sin registros",
  emptyDescription = "No hay datos para mostrar",
  enableSorting = true,
  enableResizing = true,
  enableColumnVisibility = true,
  visibleColumns = {},
  onColumnVisibilityChange = null,
  stickyHeader = true,
  rowHeight = "auto",
  getRowId = null,
  fullWidth = true, // Por defecto la tabla ocupa el 100% del ancho
}) {
  const [sorting, setSorting] = useState([]);
  const [columnSizing, setColumnSizing] = useState({});

  // Procesar columnas para agregar el wrapper de truncado automático
  const processedColumns = columns.map((col) => ({
    ...col,
    enableResizing: col.enableResizing !== false,
    cell: col.cell
      ? col.cell
      : col.truncate !== false
      ? ({ getValue }) => (
          <TruncatedCell value={getValue()} />
        )
      : undefined,
  }));

  // Filtrar columnas según visibilidad
  const filteredColumns = processedColumns.filter((col) => {
    if (Object.keys(visibleColumns).length === 0) return true;
    return visibleColumns[col.accessorKey] !== false;
  });

  const table = useReactTable({
    data,
    columns: filteredColumns,
    state: {
      sorting,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: getRowId || ((row, index) => row.id || index),
    enableColumnResizing: enableResizing,
    columnResizeMode: "onChange",
  });

  if (loading) {
    return <LoadingSpinner text="Cargando datos..." />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table 
          className="w-full text-left border-collapse"
          style={{
            width: fullWidth ? "100%" : table.getCenterTotalSize(),
            minWidth: fullWidth ? table.getCenterTotalSize() : undefined,
            tableLayout: fullWidth ? "fixed" : "auto",
          }}
        >
          <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = enableSorting && header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  const canResize = enableResizing && header.column.getCanResize();

                  // Calcular el ancho como porcentaje si fullWidth está activo
                  const totalSize = table.getCenterTotalSize();
                  const colWidth = fullWidth 
                    ? `${(header.getSize() / totalSize) * 100}%` 
                    : header.getSize();

                  return (
                    <th
                      key={header.id}
                      className={`px-3 py-3 relative group overflow-hidden ${
                        canSort ? "cursor-pointer select-none hover:bg-gray-200 transition-colors" : ""
                      }`}
                      style={{
                        width: colWidth,
                        minWidth: header.column.columnDef.minSize || 50,
                      }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-2 pr-2 whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {canSort && (
                          <span className="text-gray-400">
                            {sortDirection === "asc" ? (
                              <FaSortUp className="text-blue-600" />
                            ) : sortDirection === "desc" ? (
                              <FaSortDown className="text-blue-600" />
                            ) : (
                              <FaSort className="text-xs opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                      {/* Resize Handle */}
                      {canResize && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none z-10
                            ${header.column.getIsResizing() 
                              ? "bg-blue-500" 
                              : "bg-transparent hover:bg-blue-400"
                            }`}
                          title="Arrastrar para cambiar ancho"
                        >
                          {/* Línea visual en el centro del handle */}
                          <div 
                            className={`absolute right-0 top-0 h-full w-0.5 transition-colors
                              ${header.column.getIsResizing() 
                                ? "bg-blue-600" 
                                : "bg-gray-300 group-hover:bg-blue-400"
                              }`}
                          />
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b hover:bg-gray-50 transition-colors"
                style={{ height: rowHeight }}
              >
                {row.getVisibleCells().map((cell) => {
                  const totalSize = table.getCenterTotalSize();
                  const cellWidth = fullWidth 
                    ? `${(cell.column.getSize() / totalSize) * 100}%` 
                    : cell.column.getSize();

                  return (
                    <td
                      key={cell.id}
                      className="px-3 py-2 text-sm overflow-hidden"
                      style={{
                        width: cellWidth,
                        maxWidth: fullWidth ? undefined : cell.column.getSize(),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Exportar componente de celda truncada para uso externo
export { TruncatedCell };
