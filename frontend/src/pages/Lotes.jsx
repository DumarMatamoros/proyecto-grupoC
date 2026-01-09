import { useState, useEffect, useMemo } from "react";
import {
  FaBox,
  FaBoxes,
  FaExclamationTriangle,
  FaTrash,
  FaCalendarTimes,
  FaHistory,
  FaPlus,
  FaTimes,
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaTruck,
  FaTable,
  FaThLarge,
  FaFileExcel,
} from "react-icons/fa";
import api from "../services/api";
import { getErrorMessage } from "../utils/errorTranslator";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import useToast from "../hooks/useToast";
import * as XLSX from "xlsx";

export default function LotesPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [resumenProducto, setResumenProducto] = useState(null);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Modales
  const [modalBaja, setModalBaja] = useState(null);
  const [modalNuevoLote, setModalNuevoLote] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(null);
  const [confirmVencido, setConfirmVencido] = useState(null);
  const [historial, setHistorial] = useState([]);

  // Forms
  const [formBaja, setFormBaja] = useState({ motivo: "", cantidad: "" });
  const [formNuevoLote, setFormNuevoLote] = useState({
    cantidad: "",
    costo_unitario: "",
    fecha_vencimiento: "",
  });

  // Expandir/colapsar lotes en la lista
  const [expandido, setExpandido] = useState({});

  // Vista: 'tabla' o 'tarjetas'
  const [vistaActiva, setVistaActiva] = useState("tabla");

  // ============================
  // CARGAR PRODUCTOS
  // ============================
  const cargarProductos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/productos");
      setProductos(res.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // ============================
  // CARGAR LOTES DE UN PRODUCTO
  // ============================
  const cargarLotesProducto = async (productoId) => {
    try {
      const res = await api.get(`/productos/${productoId}/lotes`);
      setLotes(res.data.lotes);
      setResumenProducto(res.data);
      setProductoSeleccionado(res.data.producto);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // ============================
  // FILTRAR PRODUCTOS
  // ============================
  const productosFiltrados = useMemo(() => {
    if (!search.trim()) return productos;
    const term = search.toLowerCase();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.codigo_principal.toLowerCase().includes(term)
    );
  }, [productos, search]);

  // ============================
  // FILTRAR LOTES
  // ============================
  const lotesFiltrados = useMemo(() => {
    if (filtroEstado === "todos") return lotes;
    return lotes.filter((l) => l.estado === filtroEstado);
  }, [lotes, filtroEstado]);

  // ============================
  // DAR DE BAJA UN LOTE
  // ============================
  const handleDarBaja = async () => {
    if (!formBaja.motivo.trim()) {
      toast.error("Debes ingresar un motivo");
      return;
    }

    try {
      const payload = { motivo: formBaja.motivo };
      if (formBaja.cantidad) {
        payload.cantidad = parseInt(formBaja.cantidad);
      }

      const res = await api.post(`/lotes/${modalBaja.lote_id}/dar-baja`, payload);
      toast.success(res.data.message);
      setModalBaja(null);
      setFormBaja({ motivo: "", cantidad: "" });
      cargarLotesProducto(productoSeleccionado.producto_id);
      cargarProductos(); // Actualizar stock en lista
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // ============================
  // MARCAR COMO VENCIDO
  // ============================
  const handleMarcarVencido = async () => {
    try {
      const res = await api.post(`/lotes/${confirmVencido.lote_id}/marcar-vencido`);
      toast.success(res.data.message);
      setConfirmVencido(null);
      cargarLotesProducto(productoSeleccionado.producto_id);
      cargarProductos();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // ============================
  // CREAR LOTE MANUAL
  // ============================
  const handleCrearLote = async () => {
    if (!formNuevoLote.cantidad || !formNuevoLote.costo_unitario) {
      toast.error("Cantidad y costo son requeridos");
      return;
    }

    try {
      const res = await api.post("/lotes", {
        producto_id: productoSeleccionado.producto_id,
        cantidad: parseInt(formNuevoLote.cantidad),
        costo_unitario: parseFloat(formNuevoLote.costo_unitario),
        fecha_vencimiento: formNuevoLote.fecha_vencimiento || null,
      });
      toast.success(res.data.message);
      setModalNuevoLote(false);
      setFormNuevoLote({ cantidad: "", costo_unitario: "", fecha_vencimiento: "" });
      cargarLotesProducto(productoSeleccionado.producto_id);
      cargarProductos();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // ============================
  // VER HISTORIAL DE LOTE
  // ============================
  const verHistorial = async (lote) => {
    try {
      const res = await api.get(`/lotes/${lote.lote_id}/historial`);
      setHistorial(res.data.movimientos);
      setModalHistorial(lote);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // ============================
  // EXPORTAR LOTES A EXCEL
  // ============================
  const exportarExcel = () => {
    if (!productoSeleccionado || lotesFiltrados.length === 0) {
      toast.error("No hay lotes para exportar");
      return;
    }

    const data = lotesFiltrados.map((lote) => ({
      "N° Lote": lote.numero_lote || `#${lote.lote_id}`,
      "Fecha Ingreso": lote.fecha_ingreso
        ? new Date(lote.fecha_ingreso).toLocaleDateString("es-EC")
        : "-",
      "Proveedor": lote.proveedor_nombre || "Ingreso Manual",
      "# Factura": lote.numero_factura || "-",
      "Cant. Inicial": lote.cantidad_inicial,
      "Cant. Disponible": lote.cantidad_disponible,
      "Costo Unitario": `$${parseFloat(lote.costo_unitario || 0).toFixed(2)}`,
      "Valor Inventario": `$${(lote.cantidad_disponible * parseFloat(lote.costo_unitario || 0)).toFixed(2)}`,
      "Fecha Vencimiento": lote.fecha_vencimiento
        ? new Date(lote.fecha_vencimiento).toLocaleDateString("es-EC")
        : "Sin vencimiento",
      "Días para Vencer": lote.dias_para_vencimiento !== null 
        ? (lote.dias_para_vencimiento <= 0 ? "VENCIDO" : `${Math.round(lote.dias_para_vencimiento)} días`)
        : "N/A",
      "Estado": lote.estado.charAt(0).toUpperCase() + lote.estado.slice(1),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lotes");
    
    // Ajustar anchos de columna
    ws["!cols"] = [
      { wch: 12 }, // Lote
      { wch: 14 }, // Fecha Ingreso
      { wch: 25 }, // Proveedor
      { wch: 15 }, // Factura
      { wch: 12 }, // Cant Inicial
      { wch: 14 }, // Cant Disponible
      { wch: 14 }, // Costo
      { wch: 16 }, // Valor
      { wch: 16 }, // Vencimiento
      { wch: 16 }, // Días
      { wch: 10 }, // Estado
    ];

    XLSX.writeFile(wb, `Lotes_${productoSeleccionado.codigo_principal}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Lotes exportados a Excel");
  };

  // ============================
  // FORMATEAR FECHA
  // ============================
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // ============================
  // BADGE DE ESTADO
  // ============================
  const EstadoBadge = ({ estado, info }) => {
    const colores = {
      activo: "bg-green-100 text-green-800 border-green-300",
      agotado: "bg-gray-100 text-gray-800 border-gray-300",
      danado: "bg-red-100 text-red-800 border-red-300",
      vencido: "bg-orange-100 text-orange-800 border-orange-300",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colores[estado]}`}>
        {info?.label || estado}
      </span>
    );
  };

  // ============================
  // RENDER
  // ============================
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaBoxes className="text-purple-600" />
          Trazabilidad por Lotes
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL IZQUIERDO - LISTA DE PRODUCTOS */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-5 max-h-[80vh] overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaBox className="text-blue-500" />
            Productos
          </h2>

          {/* Buscador */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Lista de productos */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <LoadingSpinner text="Cargando..." />
            ) : productosFiltrados.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No hay productos</p>
            ) : (
              productosFiltrados.map((p) => (
                <div
                  key={p.producto_id}
                  onClick={() => cargarLotesProducto(p.producto_id)}
                  className={`p-3 rounded-lg border cursor-pointer transition hover:shadow-md ${
                    productoSeleccionado?.producto_id === p.producto_id
                      ? "bg-blue-50 border-blue-400"
                      : "bg-white border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {p.imagen ? (
                      <img
                        src={`http://127.0.0.1:8000/storage/${p.imagen}`}
                        alt={p.nombre}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FaBox className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{p.nombre}</p>
                      <p className="text-xs text-gray-500">{p.codigo_principal}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">{p.stock_actual}</p>
                      <p className="text-xs text-gray-400">stock</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL DERECHO - DETALLE DE LOTES */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-5">
          {!productoSeleccionado ? (
            <EmptyState
              icon={FaBoxes}
              title="Selecciona un producto"
              description="Elige un producto de la lista para ver sus lotes"
            />
          ) : (
            <>
              {/* Info del producto */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="flex items-center gap-4">
                  {productoSeleccionado.imagen ? (
                    <img
                      src={`http://127.0.0.1:8000/storage/${productoSeleccionado.imagen}`}
                      alt={productoSeleccionado.nombre}
                      className="w-16 h-16 rounded-xl object-cover shadow"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                      <FaBox className="text-gray-400 text-2xl" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {productoSeleccionado.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Código: {productoSeleccionado.codigo_principal}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setModalNuevoLote(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  <FaPlus /> Nuevo Lote
                </button>
              </div>

              {/* Resumen */}
              {resumenProducto && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {resumenProducto.resumen.total_lotes}
                    </p>
                    <p className="text-xs text-gray-600">Total Lotes</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {resumenProducto.resumen.lotes_activos}
                    </p>
                    <p className="text-xs text-gray-600">Activos</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {resumenProducto.resumen.lotes_danados}
                    </p>
                    <p className="text-xs text-gray-600">Dañados</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {resumenProducto.resumen.stock_total_disponible}
                    </p>
                    <p className="text-xs text-gray-600">Stock Disponible</p>
                  </div>
                </div>
              )}

              {/* Filtro de estado y controles */}
              <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activos</option>
                    <option value="agotado">Agotados</option>
                    <option value="danado">Dañados</option>
                    <option value="vencido">Vencidos</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle de vista */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setVistaActiva("tabla")}
                      className={`p-2 rounded-md transition cursor-pointer ${
                        vistaActiva === "tabla"
                          ? "bg-white shadow text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Vista de tabla"
                    >
                      <FaTable />
                    </button>
                    <button
                      onClick={() => setVistaActiva("tarjetas")}
                      className={`p-2 rounded-md transition cursor-pointer ${
                        vistaActiva === "tarjetas"
                          ? "bg-white shadow text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Vista de tarjetas"
                    >
                      <FaThLarge />
                    </button>
                  </div>

                  {/* Exportar Excel */}
                  <button
                    onClick={exportarExcel}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition cursor-pointer text-sm"
                    title="Exportar a Excel"
                  >
                    <FaFileExcel /> Exportar
                  </button>
                </div>
              </div>

              {/* VISTA DE TABLA PROFESIONAL */}
              {vistaActiva === "tabla" && (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-purple-600 to-purple-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Lote
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Fecha Ingreso
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Proveedor
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                          Cant.
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                          Disp.
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                          Costo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Vence
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {lotesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                            No hay lotes {filtroEstado !== "todos" && `con estado "${filtroEstado}"`}
                          </td>
                        </tr>
                      ) : (
                        lotesFiltrados.map((lote) => {
                          const diasVencer = lote.dias_para_vencimiento;
                          const esProximoVencer = diasVencer !== null && diasVencer > 0 && diasVencer <= 30;
                          const estaVencido = diasVencer !== null && diasVencer <= 0;
                          
                          return (
                            <tr
                              key={lote.lote_id}
                              className={`hover:bg-gray-50 transition ${
                                lote.estado === "danado"
                                  ? "bg-red-50"
                                  : lote.estado === "vencido" || estaVencido
                                  ? "bg-orange-50"
                                  : esProximoVencer
                                  ? "bg-yellow-50"
                                  : ""
                              }`}
                            >
                              {/* Número de Lote */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                    {lote.numero_lote?.replace("L-", "").slice(0, 3) || lote.lote_id}
                                  </div>
                                  <span className="font-medium text-gray-800">
                                    {lote.numero_lote || `#${lote.lote_id}`}
                                  </span>
                                </div>
                              </td>

                              {/* Fecha de Ingreso */}
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {formatearFecha(lote.fecha_ingreso)}
                              </td>

                              {/* Proveedor */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <FaTruck className={`text-sm ${lote.proveedor_nombre === "Ingreso Manual" ? "text-gray-400" : "text-blue-500"}`} />
                                  <div>
                                    <p className="text-sm font-medium text-gray-800 truncate max-w-[150px]" title={lote.proveedor_nombre}>
                                      {lote.proveedor_nombre || "Ingreso Manual"}
                                    </p>
                                    {lote.numero_factura && lote.numero_factura !== "-" && (
                                      <p className="text-xs text-gray-500">Fact: {lote.numero_factura}</p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Cantidad Inicial */}
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-600">{lote.cantidad_inicial}</span>
                              </td>

                              {/* Cantidad Disponible */}
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className={`text-sm font-bold ${
                                  lote.cantidad_disponible === 0 
                                    ? "text-red-500" 
                                    : lote.cantidad_disponible <= lote.cantidad_inicial * 0.2 
                                    ? "text-orange-500" 
                                    : "text-green-600"
                                }`}>
                                  {lote.cantidad_disponible}
                                </span>
                              </td>

                              {/* Costo Unitario */}
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span className="text-sm font-medium text-gray-800">
                                  ${parseFloat(lote.costo_unitario || 0).toFixed(2)}
                                </span>
                              </td>

                              {/* Fecha Vencimiento */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {lote.fecha_vencimiento ? (
                                  <div>
                                    <p className={`text-sm font-medium ${
                                      estaVencido ? "text-red-600" : esProximoVencer ? "text-orange-600" : "text-gray-700"
                                    }`}>
                                      {formatearFecha(lote.fecha_vencimiento)}
                                    </p>
                                    <p className={`text-xs ${
                                      estaVencido ? "text-red-500 font-bold" : esProximoVencer ? "text-orange-500" : "text-gray-400"
                                    }`}>
                                      {estaVencido 
                                        ? "¡VENCIDO!" 
                                        : diasVencer !== null 
                                        ? `${Math.round(diasVencer)} días`
                                        : ""
                                      }
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Sin venc.</span>
                                )}
                              </td>

                              {/* Estado */}
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <EstadoBadge estado={lote.estado} info={lote.estado_info} />
                              </td>

                              {/* Acciones */}
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => verHistorial(lote)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                    title="Ver historial"
                                  >
                                    <FaHistory />
                                  </button>
                                  
                                  {lote.estado === "activo" && lote.cantidad_disponible > 0 && (
                                    <>
                                      <button
                                        onClick={() => setModalBaja(lote)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                        title="Dar de baja"
                                      >
                                        <FaTrash />
                                      </button>
                                      
                                      {lote.fecha_vencimiento && (
                                        <button
                                          onClick={() => setConfirmVencido(lote)}
                                          className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                                          title="Marcar vencido"
                                        >
                                          <FaCalendarTimes />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Totales de la tabla */}
                  {lotesFiltrados.length > 0 && (
                    <div className="bg-gray-50 px-4 py-3 border-t flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Mostrando <strong>{lotesFiltrados.length}</strong> lotes
                      </span>
                      <div className="flex gap-6">
                        <span className="text-gray-600">
                          Total disponible: <strong className="text-green-600">
                            {lotesFiltrados.reduce((acc, l) => acc + l.cantidad_disponible, 0)} uds
                          </strong>
                        </span>
                        <span className="text-gray-600">
                          Valor inventario: <strong className="text-purple-600">
                            ${lotesFiltrados.reduce((acc, l) => acc + (l.cantidad_disponible * parseFloat(l.costo_unitario || 0)), 0).toFixed(2)}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VISTA DE TARJETAS (Original) */}
              {vistaActiva === "tarjetas" && (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {lotesFiltrados.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay lotes {filtroEstado !== "todos" && `con estado "${filtroEstado}"`}
                  </p>
                ) : (
                  lotesFiltrados.map((lote) => (
                    <div
                      key={lote.lote_id}
                      className={`border rounded-xl overflow-hidden transition ${
                        lote.estado === "danado"
                          ? "border-red-300 bg-red-50"
                          : lote.estado === "vencido"
                          ? "border-orange-300 bg-orange-50"
                          : lote.dias_para_vencimiento !== null && lote.dias_para_vencimiento <= 30 && lote.dias_para_vencimiento > 0
                          ? "border-yellow-300 bg-yellow-50"
                          : "border-gray-200"
                      }`}
                    >
                      {/* Header del lote */}
                      <div
                        className="p-4 flex items-center justify-between cursor-pointer"
                        onClick={() =>
                          setExpandido((prev) => ({
                            ...prev,
                            [lote.lote_id]: !prev[lote.lote_id],
                          }))
                        }
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow">
                            {lote.numero_lote?.replace("L-", "") || lote.lote_id}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">
                              Lote {lote.numero_lote || `#${lote.lote_id}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              Ingreso: {new Date(lote.fecha_ingreso).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-800">
                              {lote.cantidad_disponible}
                              <span className="text-sm font-normal text-gray-500">
                                /{lote.cantidad_inicial}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">disponible</p>
                          </div>

                          <EstadoBadge estado={lote.estado} info={lote.estado_info} />

                          {expandido[lote.lote_id] ? (
                            <FaChevronUp className="text-gray-400" />
                          ) : (
                            <FaChevronDown className="text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Detalle expandido */}
                      {expandido[lote.lote_id] && (
                        <div className="px-4 pb-4 border-t bg-white/50">
                          {/* Info del proveedor */}
                          <div className="flex items-center gap-2 py-3 border-b mb-3">
                            <FaTruck className={`text-sm ${lote.proveedor_nombre === "Ingreso Manual" ? "text-gray-400" : "text-blue-500"}`} />
                            <span className="text-sm font-medium text-gray-700">
                              {lote.proveedor_nombre || "Ingreso Manual"}
                            </span>
                            {lote.numero_factura && lote.numero_factura !== "-" && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                Fact: {lote.numero_factura}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
                            <div>
                              <p className="text-xs text-gray-500">Costo Unitario</p>
                              <p className="font-semibold">${lote.costo_unitario}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Valor Total</p>
                              <p className="font-semibold">
                                ${(lote.cantidad_disponible * lote.costo_unitario).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Fecha Vencimiento</p>
                              <p className="font-semibold">
                                {lote.fecha_vencimiento
                                  ? new Date(lote.fecha_vencimiento).toLocaleDateString()
                                  : "Sin vencimiento"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Días para vencer</p>
                              <p
                                className={`font-semibold ${
                                  lote.dias_para_vencimiento !== null
                                    ? lote.dias_para_vencimiento <= 0
                                      ? "text-red-600"
                                      : lote.dias_para_vencimiento <= 30
                                      ? "text-orange-600"
                                      : "text-green-600"
                                    : ""
                                }`}
                              >
                                {lote.dias_para_vencimiento !== null
                                  ? lote.dias_para_vencimiento <= 0
                                    ? "¡VENCIDO!"
                                    : `${Math.round(lote.dias_para_vencimiento)} días`
                                  : "N/A"}
                              </p>
                            </div>
                          </div>

                          {/* Motivo de baja si existe */}
                          {lote.motivo_baja && (
                            <div className="bg-red-100 rounded-lg p-3 mb-4">
                              <p className="text-xs font-semibold text-red-800">Motivo de baja:</p>
                              <p className="text-sm text-red-700">{lote.motivo_baja}</p>
                              {lote.fecha_baja && (
                                <p className="text-xs text-red-500 mt-1">
                                  Fecha: {new Date(lote.fecha_baja).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Acciones */}
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => verHistorial(lote)}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition cursor-pointer"
                            >
                              <FaHistory /> Ver Historial
                            </button>

                            {lote.estado === "activo" && lote.cantidad_disponible > 0 && (
                              <>
                                <button
                                  onClick={() => setModalBaja(lote)}
                                  className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition cursor-pointer"
                                >
                                  <FaTrash /> Dar de Baja (Dañado)
                                </button>

                                {lote.fecha_vencimiento && (
                                  <button
                                    onClick={() => setConfirmVencido(lote)}
                                    className="flex items-center gap-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm transition cursor-pointer"
                                  >
                                    <FaCalendarTimes /> Marcar Vencido
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL DAR DE BAJA */}
      {modalBaja && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="text-red-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Dar de Baja Lote</h3>
                <p className="text-sm text-gray-500">Lote {modalBaja.numero_lote}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Atención:</strong> Esta acción descontará las unidades del stock y
                registrará el movimiento de productos.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad a dar de baja (máx: {modalBaja.cantidad_disponible})
                </label>
                <input
                  type="number"
                  min="1"
                  max={modalBaja.cantidad_disponible}
                  placeholder={`Dejar vacío para todas (${modalBaja.cantidad_disponible})`}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={formBaja.cantidad}
                  onChange={(e) => setFormBaja({ ...formBaja, cantidad: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de la baja *
                </label>
                <textarea
                  placeholder="Ej: Producto dañado por humedad, caducado, defectuoso..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  rows="3"
                  value={formBaja.motivo}
                  onChange={(e) => setFormBaja({ ...formBaja, motivo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDarBaja}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition cursor-pointer"
              >
                Confirmar Baja
              </button>
              <button
                onClick={() => {
                  setModalBaja(null);
                  setFormBaja({ motivo: "", cantidad: "" });
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO LOTE */}
      {modalNuevoLote && productoSeleccionado && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Nuevo Lote</h3>
              <button
                onClick={() => setModalNuevoLote(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                Creando lote para: <strong>{productoSeleccionado.nombre}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Cantidad de unidades"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formNuevoLote.cantidad}
                  onChange={(e) =>
                    setFormNuevoLote({ ...formNuevoLote, cantidad: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Unitario *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formNuevoLote.costo_unitario}
                  onChange={(e) =>
                    setFormNuevoLote({ ...formNuevoLote, costo_unitario: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento (opcional)
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formNuevoLote.fecha_vencimiento}
                  onChange={(e) =>
                    setFormNuevoLote({ ...formNuevoLote, fecha_vencimiento: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCrearLote}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition cursor-pointer"
              >
                Crear Lote
              </button>
              <button
                onClick={() => {
                  setModalNuevoLote(false);
                  setFormNuevoLote({ cantidad: "", costo_unitario: "", fecha_vencimiento: "" });
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL */}
      {modalHistorial && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Historial - Lote {modalHistorial.numero_lote}
              </h3>
              <button
                onClick={() => setModalHistorial(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {historial.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay movimientos registrados</p>
              ) : (
                <div className="space-y-3">
                  {historial.map((mov, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        mov.tipo_movimiento === "ingreso"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span
                            className={`text-xs font-bold uppercase ${
                              mov.tipo_movimiento === "ingreso" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {mov.tipo_movimiento}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">{mov.referencia}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(mov.fecha).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              mov.tipo_movimiento === "ingreso" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {mov.tipo_movimiento === "ingreso" ? "+" : "-"}
                            {mov.cantidad}
                          </p>
                          <p className="text-xs text-gray-500">
                            Stock: {mov.stock_anterior} → {mov.stock_nuevo}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setModalHistorial(null)}
              className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR VENCIDO */}
      {confirmVencido && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FaCalendarTimes className="text-orange-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Marcar como Vencido</h3>
                <p className="text-sm text-gray-500">Lote {confirmVencido.numero_lote || `#${confirmVencido.lote_id}`}</p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-800">
                <strong>¿Estás seguro?</strong> Se descontarán <strong>{confirmVencido.cantidad_disponible}</strong> unidades del stock y el lote quedará marcado como vencido.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleMarcarVencido}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition cursor-pointer"
              >
                Sí, marcar vencido
              </button>
              <button
                onClick={() => setConfirmVencido(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
