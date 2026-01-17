import { useState, useEffect, useMemo } from "react";
import {
  FaHistory,
  FaSearch,
  FaFilter,
  FaFileExcel,
  FaFilePdf,
  FaEye,
  FaBan,
  FaTrash,
  FaTimes,
  FaDollarSign,
  FaChartLine,
  FaPercentage,
  FaClock,
  FaFileInvoiceDollar,
  FaReceipt,
  FaPrint,
  FaDownload,
} from "react-icons/fa";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import PrintModal from "../components/PrintModal";
import {
  getFacturas,
  getEstadisticas,
  updateFactura,
  deleteFactura,
  formatCurrency,
  formatDate,
  formatDateTime,
  FORMAS_PAGO,
  ESTADOS_FACTURA,
  ESTADO_COLORS,
} from "../services/facturaService";
import {
  downloadSalesExcel,
  downloadSalesPdf,
  downloadTicket,
  downloadInvoice,
} from "../services/downloadService";
import useToast from "../hooks/useToast";
import { translateError } from "../utils/errorTranslator";

export default function HistorialVentas() {
  const toast = useToast();

  // Estados principales
  const [facturas, setFacturas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true);

  // Estados de búsqueda y filtros
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados del modal de detalle
  const [modalDetalle, setModalDetalle] = useState(null);

  // Estados de anulación
  const [confirmAnular, setConfirmAnular] = useState(null);
  const [anulando, setAnulando] = useState(false);

  // Estados de eliminación
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Estados de exportación
  const [exporting, setExporting] = useState(false);

  // Estados del modal de impresión
  const [printModal, setPrintModal] = useState({
    isOpen: false,
    documentUrl: "",
    title: "",
    size: "ticket",
  });

  // Carga inicial de datos
  const cargarDatos = async () => {
    setLoading(true);
    setLoadingEstadisticas(true);
    try {
      const facturasRes = await getFacturas();
      setFacturas(facturasRes);
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setLoading(false);
    }

    // Cargar estadísticas en paralelo
    try {
      const estadisticasRes = await getEstadisticas();
      setEstadisticas(estadisticasRes);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  const cargarFacturas = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroFechaInicio) params.fecha_inicio = filtroFechaInicio;
      if (filtroFechaFin) params.fecha_fin = filtroFechaFin;
      if (search) params.search = search;

      const facturasRes = await getFacturas(params);
      setFacturas(facturasRes);
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar cuando cambian los filtros
  useEffect(() => {
    if (!loading) {
      cargarFacturas();
    }
  }, [filtroEstado, filtroFechaInicio, filtroFechaFin]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        cargarFacturas();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Paginación
  const facturasPaginadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return facturas.slice(start, start + itemsPerPage);
  }, [facturas, currentPage]);

  const totalPages = Math.ceil(facturas.length / itemsPerPage);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filtroEstado, filtroFechaInicio, filtroFechaFin]);

  // Anular factura
  const handleAnularFactura = async () => {
    if (!confirmAnular) return;

    setAnulando(true);
    try {
      await updateFactura(confirmAnular.factura_id, { estado: "anulada" });
      toast.success("Factura anulada exitosamente");
      setConfirmAnular(null);
      cargarDatos();
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setAnulando(false);
    }
  };

  // Eliminar factura
  const handleEliminarFactura = async () => {
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await deleteFactura(confirmDelete.factura_id);
      toast.success("Factura eliminada exitosamente");
      setConfirmDelete(null);
      cargarDatos();
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setDeleting(false);
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearch("");
    setFiltroEstado("");
    setFiltroFechaInicio("");
    setFiltroFechaFin("");
  };

  // Obtener filtros actuales para exportación
  const getActiveFilters = () => {
    const filters = {};
    if (filtroEstado) filters.estado = filtroEstado;
    if (filtroFechaInicio) filters.fecha_inicio = filtroFechaInicio;
    if (filtroFechaFin) filters.fecha_fin = filtroFechaFin;
    if (search) filters.search = search;
    return filters;
  };

  // Exportar a Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await downloadSalesExcel(getActiveFilters());
      toast.success("Archivo Excel descargado exitosamente");
    } catch (error) {
      toast.error(translateError(error) || "Error al exportar a Excel");
    } finally {
      setExporting(false);
    }
  };

  // Exportar a PDF
  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await downloadSalesPdf(getActiveFilters());
      toast.success("Archivo PDF descargado exitosamente");
    } catch (error) {
      toast.error(translateError(error) || "Error al exportar a PDF");
    } finally {
      setExporting(false);
    }
  };

  // Abrir modal de impresión de ticket
  const handlePrintTicket = (factura) => {
    setPrintModal({
      isOpen: true,
      documentUrl: `/sales/${factura.factura_id}/ticket`,
      title: `Ticket - ${factura.numero_factura}`,
      size: "ticket",
    });
  };

  // Abrir modal de impresión de factura
  const handlePrintInvoice = (factura) => {
    setPrintModal({
      isOpen: true,
      documentUrl: `/sales/${factura.factura_id}/invoice`,
      title: `Factura - ${factura.numero_factura}`,
      size: "invoice",
    });
  };

  // Descargar ticket directamente
  const handleDownloadTicket = async (factura) => {
    try {
      await downloadTicket(factura.factura_id);
      toast.success("Ticket descargado");
    } catch (error) {
      toast.error("Error al descargar ticket");
    }
  };

  // Descargar factura directamente
  const handleDownloadInvoice = async (factura) => {
    try {
      await downloadInvoice(factura.factura_id);
      toast.success("Factura descargada");
    } catch (error) {
      toast.error("Error al descargar factura");
    }
  };

  // Cerrar modal de impresión
  const closePrintModal = () => {
    setPrintModal({
      isOpen: false,
      documentUrl: "",
      title: "",
      size: "ticket",
    });
  };

  // Columnas de la tabla
  const columns = useMemo(
    () => [
      {
        accessorKey: "numero_factura",
        header: "N° Factura",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.numero_factura}</span>
        ),
      },
      {
        accessorKey: "fecha_emision",
        header: "Fecha",
        cell: ({ row }) => formatDate(row.original.fecha_emision),
      },
      {
        accessorKey: "cedula_cliente",
        header: "Cliente",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.nombre_cliente}</div>
            <div className="text-xs text-gray-500">{row.original.cedula_cliente}</div>
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-semibold">{formatCurrency(row.original.total)}</span>
        ),
      },
      {
        accessorKey: "forma_pago",
        header: "Pago",
        cell: ({ row }) => FORMAS_PAGO[row.original.forma_pago] || row.original.forma_pago,
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              ESTADO_COLORS[row.original.estado] || "bg-gray-100 text-gray-800"
            }`}
          >
            {ESTADOS_FACTURA[row.original.estado] || row.original.estado}
          </span>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <button
              onClick={() => setModalDetalle(row.original)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
              title="Ver detalle"
            >
              <FaEye />
            </button>
            <button
              onClick={() => handlePrintTicket(row.original)}
              className="p-2 text-green-600 hover:bg-green-50 rounded cursor-pointer"
              title="Imprimir ticket"
            >
              <FaReceipt />
            </button>
            <button
              onClick={() => handlePrintInvoice(row.original)}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded cursor-pointer"
              title="Imprimir factura"
            >
              <FaPrint />
            </button>
            {row.original.estado === "emitida" && (
              <button
                onClick={() => setConfirmAnular(row.original)}
                className="p-2 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                title="Anular factura"
              >
                <FaBan />
              </button>
            )}
            {row.original.estado === "pendiente" && (
              <button
                onClick={() => setConfirmDelete(row.original)}
                className="p-2 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                title="Eliminar factura"
              >
                <FaTrash />
              </button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  // Renderizar estadísticas
  const renderEstadisticas = () => {
    if (loadingEstadisticas) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      );
    }

    if (!estadisticas) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ventas de Hoy</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(estadisticas.ventas_hoy)}
              </p>
              <p className="text-xs text-gray-400">{estadisticas.facturas_hoy} facturas</p>
            </div>
            <FaDollarSign className="text-3xl text-green-200" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ventas del Mes</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(estadisticas.ventas_mes)}
              </p>
              <p className="text-xs text-gray-400">{estadisticas.facturas_mes} facturas</p>
            </div>
            <FaChartLine className="text-3xl text-blue-200" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">IVA Recaudado (Mes)</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(estadisticas.iva_recaudado_mes)}
              </p>
              <p className="text-xs text-gray-400">Impuestos</p>
            </div>
            <FaPercentage className="text-3xl text-purple-200" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {estadisticas.facturas_pendientes}
              </p>
              <p className="text-xs text-gray-400">Por procesar</p>
            </div>
            <FaClock className="text-3xl text-yellow-200" />
          </div>
        </div>
      </div>
    );
  };

  // Modal de detalle de factura
  const renderModalDetalle = () => {
    if (!modalDetalle) return null;

    return (
      <div 
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
        onClick={() => setModalDetalle(null)}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaFileInvoiceDollar className="text-blue-500" />
              Factura {modalDetalle.numero_factura}
            </h2>
            <button
              onClick={() => setModalDetalle(null)}
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
            {/* Estado */}
            <div className="flex justify-between items-center mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  ESTADO_COLORS[modalDetalle.estado] || "bg-gray-100"
                }`}
              >
                {ESTADOS_FACTURA[modalDetalle.estado]}
              </span>
              <span className="text-sm text-gray-500">
                {formatDateTime(modalDetalle.fecha_emision)} - {modalDetalle.hora}
              </span>
            </div>

            {/* Datos del cliente */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Datos del Cliente</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Documento:</span>
                  <span className="ml-2">{modalDetalle.cedula_cliente}</span>
                </div>
                <div>
                  <span className="text-gray-500">Nombre:</span>
                  <span className="ml-2">{modalDetalle.nombre_cliente}</span>
                </div>
                {modalDetalle.direccion_cliente && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Dirección:</span>
                    <span className="ml-2">{modalDetalle.direccion_cliente}</span>
                  </div>
                )}
                {modalDetalle.telefono_cliente && (
                  <div>
                    <span className="text-gray-500">Teléfono:</span>
                    <span className="ml-2">{modalDetalle.telefono_cliente}</span>
                  </div>
                )}
                {modalDetalle.email_cliente && (
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2">{modalDetalle.email_cliente}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles de productos */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Detalle de Productos</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-right">Cant.</th>
                    <th className="px-3 py-2 text-right">P.Unit</th>
                    <th className="px-3 py-2 text-right">IVA</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {modalDetalle.detalles?.map((detalle, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        {detalle.producto?.nombre || `Producto #${detalle.producto_id}`}
                      </td>
                      <td className="px-3 py-2 text-right">{detalle.cantidad}</td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(detalle.precio_unitario)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {detalle.iva_aplica ? `${detalle.porcentaje_iva}%` : "-"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(detalle.total_detalle)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(modalDetalle.total_sin_impuestos)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>IVA:</span>
                  <span>{formatCurrency(modalDetalle.total_iva)}</span>
                </div>
                {modalDetalle.descuento > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento:</span>
                    <span>-{formatCurrency(modalDetalle.descuento)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL:</span>
                  <span className="text-blue-600">{formatCurrency(modalDetalle.total)}</span>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-4 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Forma de pago:</span>
                <span>{FORMAS_PAGO[modalDetalle.forma_pago]}</span>
              </div>
              {modalDetalle.observaciones && (
                <div className="mt-2">
                  <span>Observaciones:</span>
                  <p className="text-gray-700">{modalDetalle.observaciones}</p>
                </div>
              )}
              {modalDetalle.clave_acceso && (
                <div className="mt-2">
                  <span>Clave de acceso:</span>
                  <p className="font-mono text-xs break-all">{modalDetalle.clave_acceso}</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t flex justify-between gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => handleDownloadTicket(modalDetalle)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
              >
                <FaReceipt />
                Ticket
              </button>
              <button
                onClick={() => handleDownloadInvoice(modalDetalle)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer"
              >
                <FaDownload />
                Factura
              </button>
            </div>
            <button
              onClick={() => setModalDetalle(null)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <FaHistory className="text-blue-600" />
            Historial de Ventas
          </h1>
          <p className="text-gray-500 mt-1">
            Consulta y gestiona todas las ventas realizadas
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FaFileExcel />
            )}
            Exportar Excel
          </button>
          <button 
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FaFilePdf />
            )}
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="N° factura, cliente, producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={filtroFechaInicio}
              onChange={(e) => setFiltroFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={filtroFechaFin}
              onChange={(e) => setFiltroFechaFin(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {Object.entries(ESTADOS_FACTURA).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition cursor-pointer"
          >
            <FaTimes />
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla de facturas */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : facturas.length === 0 ? (
          <EmptyState
            icon={FaFileInvoiceDollar}
            title="No hay facturas"
            description="No se encontraron facturas con los filtros aplicados"
          />
        ) : (
          <>
            <DataTable columns={columns} data={facturasPaginadas} />
            {totalPages > 1 && (
              <div className="p-4 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Estadísticas */}
      {renderEstadisticas()}

      {/* Modal de detalle */}
      {renderModalDetalle()}

      {/* Confirmar anulación */}
      {confirmAnular && (
        <ConfirmDialog
          title="Anular Factura"
          message={`¿Está seguro que desea anular la factura ${confirmAnular?.numero_factura}? Esta acción devolverá los productos al inventario.`}
          confirmText="Anular"
          confirmingText="Anulando..."
          cancelText="Cancelar"
          onConfirm={handleAnularFactura}
          onCancel={() => setConfirmAnular(null)}
          isLoading={anulando}
          confirmColor="red"
        />
      )}

      {/* Confirmar eliminación */}
      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar Factura"
          message={`¿Está seguro que desea eliminar la factura ${confirmDelete?.numero_factura}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          confirmingText="Eliminando..."
          cancelText="Cancelar"
          onConfirm={handleEliminarFactura}
          onCancel={() => setConfirmDelete(null)}
          isLoading={deleting}
          confirmColor="red"
        />
      )}

      {/* Modal de impresión */}
      <PrintModal
        isOpen={printModal.isOpen}
        onClose={closePrintModal}
        documentUrl={printModal.documentUrl}
        title={printModal.title}
        size={printModal.size}
      />
    </div>
  );
}
