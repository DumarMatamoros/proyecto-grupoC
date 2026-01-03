import { useState, useEffect, useMemo } from "react";
import {
  FaTrashAlt,
  FaPlus,
  FaSearch,
  FaTimes,
  FaExclamationTriangle,
  FaCalendarTimes,
  FaBox,
  FaChartLine,
  FaTrash,
  FaEye,
  FaFilter,
  FaBalanceScale,
  FaUserSecret,
  FaQuestionCircle,
  FaArrowDown,
  FaDollarSign,
  FaCalendarAlt,
} from "react-icons/fa";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import SearchableSelect from "../components/SearchableSelect";
import Pagination from "../components/Pagination";
import api from "../services/api";
import {
  getEgresos,
  getEstadisticasEgresos,
  createEgreso,
  deleteEgreso,
  MOTIVOS_EGRESO,
} from "../services/egresoService";
import useToast from "../hooks/useToast";
import { translateError } from "../utils/errorTranslator";

export default function Egresos() {
  const toast = useToast();

  // Estados principales
  const [egresos, setEgresos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true);

  // Estados del modal de nuevo egreso
  const [modalNuevo, setModalNuevo] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados del modal de detalle
  const [modalDetalle, setModalDetalle] = useState(null);

  // Estados de eliminación
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Estados de búsqueda y filtros
  const [search, setSearch] = useState("");
  const [filtroMotivo, setFiltroMotivo] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Formulario de nuevo egreso
  const [nuevoEgreso, setNuevoEgreso] = useState({
    fecha: new Date().toISOString().split("T")[0],
    motivo: "desecho",
    observaciones: "",
    detalles: [],
  });

  // Producto seleccionado para agregar
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadAgregar, setCantidadAgregar] = useState(1);
  const [motivoDetalle, setMotivoDetalle] = useState("");

  const cargarDatos = async () => {
    setLoading(true);
    setLoadingEstadisticas(true);
    try {
      const [egresosRes, productosRes, estadisticasRes] = await Promise.all([
        getEgresos(),
        api.get("/productos"),
        getEstadisticasEgresos(),
      ]);
      setEgresos(egresosRes);
      setProductos(productosRes.data);
      setEstadisticas(estadisticasRes);
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setLoading(false);
      setLoadingEstadisticas(false);
    }
  };

  const cargarEgresos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroMotivo) params.motivo = filtroMotivo;
      if (filtroFechaInicio) params.fecha_inicio = filtroFechaInicio;
      if (filtroFechaFin) params.fecha_fin = filtroFechaFin;
      if (search) params.search = search;

      const egresosRes = await getEgresos(params);
      setEgresos(egresosRes);
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    if (!loading) {
      cargarEgresos();
    }
  }, [filtroMotivo, filtroFechaInicio, filtroFechaFin]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        cargarEgresos();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtrado y paginación
  const egresosFiltrados = useMemo(() => {
    return egresos;
  }, [egresos]);

  const egresosPaginados = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return egresosFiltrados.slice(start, start + itemsPerPage);
  }, [egresosFiltrados, currentPage]);

  const totalPages = Math.ceil(egresosFiltrados.length / itemsPerPage);

  // Productos disponibles para el select (con stock)
  const productosDisponibles = useMemo(() => {
    return productos
      .filter((p) => p.stock_actual > 0)
      .map((p) => ({
        value: p.producto_id.toString(),
        label: `[${p.codigo_principal}] ${p.nombre} (Stock: ${p.stock_actual})`,
        producto: p,
      }));
  }, [productos]);

  // Agregar producto al egreso
  const agregarProducto = () => {
    if (!productoSeleccionado) {
      toast.warning("Seleccione un producto");
      return;
    }

    const producto = productos.find(
      (p) => p.producto_id.toString() === productoSeleccionado
    );
    if (!producto) return;

    if (cantidadAgregar <= 0) {
      toast.warning("La cantidad debe ser mayor a 0");
      return;
    }

    if (cantidadAgregar > producto.stock_actual) {
      toast.warning(
        `Stock insuficiente. Disponible: ${producto.stock_actual}`
      );
      return;
    }

    // Verificar si ya existe en la lista
    const existe = nuevoEgreso.detalles.find(
      (d) => d.producto_id.toString() === productoSeleccionado
    );
    if (existe) {
      toast.warning("Este producto ya está en la lista");
      return;
    }

    const precioUnitario = producto.precio_costo || producto.precio_unitario || 0;

    setNuevoEgreso({
      ...nuevoEgreso,
      detalles: [
        ...nuevoEgreso.detalles,
        {
          producto_id: productoSeleccionado,
          producto: producto,
          cantidad: cantidadAgregar,
          precio_unitario: precioUnitario,
          subtotal: cantidadAgregar * precioUnitario,
          motivo_detalle: motivoDetalle,
        },
      ],
    });

    setProductoSeleccionado("");
    setCantidadAgregar(1);
    setMotivoDetalle("");
  };

  // Quitar producto del egreso
  const quitarProducto = (productoId) => {
    setNuevoEgreso({
      ...nuevoEgreso,
      detalles: nuevoEgreso.detalles.filter(
        (d) => d.producto_id !== productoId
      ),
    });
  };

  // Actualizar cantidad de un producto
  const actualizarCantidad = (productoId, nuevaCantidad) => {
    setNuevoEgreso({
      ...nuevoEgreso,
      detalles: nuevoEgreso.detalles.map((d) => {
        if (d.producto_id === productoId) {
          const cantidad = Math.max(1, Math.min(nuevaCantidad, d.producto.stock_actual));
          return {
            ...d,
            cantidad,
            subtotal: cantidad * d.precio_unitario,
          };
        }
        return d;
      }),
    });
  };

  // Calcular totales del egreso
  const totalesEgreso = useMemo(() => {
    const totalUnidades = nuevoEgreso.detalles.reduce(
      (sum, d) => sum + d.cantidad,
      0
    );
    const valorTotal = nuevoEgreso.detalles.reduce(
      (sum, d) => sum + d.subtotal,
      0
    );
    return { totalUnidades, valorTotal };
  }, [nuevoEgreso.detalles]);

  // Guardar egreso
  const guardarEgreso = async () => {
    if (nuevoEgreso.detalles.length === 0) {
      toast.warning("Agregue al menos un producto");
      return;
    }

    setSaving(true);
    try {
      await createEgreso({
        fecha: nuevoEgreso.fecha,
        motivo: nuevoEgreso.motivo,
        observaciones: nuevoEgreso.observaciones,
        detalles: nuevoEgreso.detalles.map((d) => ({
          producto_id: d.producto_id,
          cantidad: d.cantidad,
          motivo_detalle: d.motivo_detalle,
        })),
      });

      toast.success("Egreso registrado correctamente");
      cerrarModalNuevo();
      cargarDatos();
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setSaving(false);
    }
  };

  // Eliminar egreso
  const handleDelete = async () => {
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await deleteEgreso(confirmDelete.egreso_id);
      toast.success("Egreso eliminado y stock revertido");
      setConfirmDelete(null);
      cargarDatos();
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setDeleting(false);
    }
  };

  // Cerrar modal nuevo
  const cerrarModalNuevo = () => {
    setModalNuevo(false);
    setNuevoEgreso({
      fecha: new Date().toISOString().split("T")[0],
      motivo: "desecho",
      observaciones: "",
      detalles: [],
    });
    setProductoSeleccionado("");
    setCantidadAgregar(1);
    setMotivoDetalle("");
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearch("");
    setFiltroMotivo("");
    setFiltroFechaInicio("");
    setFiltroFechaFin("");
  };

  // Icono del motivo
  const getIconoMotivo = (motivo) => {
    const iconos = {
      desecho: <FaTrash className="text-gray-500" />,
      vencido: <FaCalendarTimes className="text-orange-500" />,
      dañado: <FaExclamationTriangle className="text-red-500" />,
      perdida: <FaUserSecret className="text-purple-500" />,
      ajuste: <FaBalanceScale className="text-blue-500" />,
      otro: <FaQuestionCircle className="text-gray-400" />,
    };
    return iconos[motivo] || iconos.otro;
  };

  // Columnas de la tabla
  const columns = [
    {
      accessorKey: "egreso_id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-sm">#{row.original.egreso_id}</span>
      ),
      size: 80,
    },
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-gray-700">
          {new Date(row.original.fecha).toLocaleDateString("es-EC")}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "motivo",
      header: "Motivo",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getIconoMotivo(row.original.motivo)}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
              MOTIVOS_EGRESO[row.original.motivo]?.color || "bg-gray-400"
            }`}
          >
            {MOTIVOS_EGRESO[row.original.motivo]?.label || row.original.motivo}
          </span>
        </div>
      ),
      size: 180,
    },
    {
      accessorKey: "total_unidades",
      header: "Unidades",
      cell: ({ row }) => (
        <span className="font-semibold text-red-600">
          -{row.original.total_unidades}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: "valor_total",
      header: "Valor Perdido",
      cell: ({ row }) => (
        <span className="font-semibold text-red-600">
          ${parseFloat(row.original.valor_total || 0).toFixed(2)}
        </span>
      ),
      size: 130,
    },
    {
      accessorKey: "productos",
      header: "Productos",
      cell: ({ row }) => (
        <span className="text-gray-600">
          {row.original.detalles?.length || 0} producto(s)
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "usuario",
      header: "Registrado por",
      cell: ({ row }) => (
        <span className="text-gray-500 text-sm">
          {row.original.usuario?.name || "Sistema"}
        </span>
      ),
      size: 140,
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => setModalDetalle(row.original)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
            title="Ver detalle"
          >
            <FaEye />
          </button>
          <button
            onClick={() => setConfirmDelete(row.original)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
            title="Eliminar"
          >
            <FaTrashAlt />
          </button>
        </div>
      ),
      size: 100,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaArrowDown className="text-red-600" />
            Egresos de Inventario
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona productos dañados, vencidos, pérdidas y ajustes de inventario
          </p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-semibold transition shadow-md cursor-pointer"
        >
          <FaPlus /> Nuevo Egreso
        </button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
          <div className="bg-red-100 text-red-600 p-3 rounded-full">
            <FaArrowDown className="text-xl" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Egresos del Mes</p>
            <p className="text-2xl font-bold text-gray-800">
              {loadingEstadisticas ? "..." : estadisticas?.total_egresos_mes || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
          <div className="bg-orange-100 text-orange-600 p-3 rounded-full">
            <FaBox className="text-xl" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Unidades Perdidas</p>
            <p className="text-2xl font-bold text-gray-800">
              {loadingEstadisticas ? "..." : estadisticas?.unidades_perdidas_mes || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
          <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
            <FaDollarSign className="text-xl" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Valor Perdido (Mes)</p>
            <p className="text-2xl font-bold text-gray-800">
              ${loadingEstadisticas ? "..." : parseFloat(estadisticas?.valor_perdido_mes || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
            <FaCalendarAlt className="text-xl" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Egresos Hoy</p>
            <p className="text-2xl font-bold text-gray-800">
              {loadingEstadisticas ? "..." : estadisticas?.egresos_hoy || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por producto, código u observaciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition cursor-pointer ${
              showFilters
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaFilter />
            Filtros
          </button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <select
                value={filtroMotivo}
                onChange={(e) => setFiltroMotivo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="">Todos los motivos</option>
                {Object.entries(MOTIVOS_EGRESO).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition cursor-pointer"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de egresos */}
      <div className="bg-white rounded-xl shadow-md p-5">
        {loading ? (
          <LoadingSpinner />
        ) : egresosFiltrados.length === 0 ? (
          <EmptyState
            icon={FaArrowDown}
            title="No hay egresos registrados"
            description="Registra un nuevo egreso cuando tengas productos dañados, vencidos o pérdidas"
          />
        ) : (
          <>
            <DataTable
              data={egresosPaginados}
              columns={columns}
              loading={false}
              emptyIcon={FaArrowDown}
              emptyTitle="Sin egresos"
              emptyDescription="No hay egresos que coincidan con la búsqueda"
              enableSorting={true}
              getRowId={(row) => row.egreso_id}
            />
            {egresosFiltrados.length > 0 && (
              <div className="mt-4">
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

      {/* Modal de Nuevo Egreso */}
      {modalNuevo && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
          onClick={cerrarModalNuevo}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-5xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={cerrarModalNuevo}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <FaTimes className="text-lg" />
            </button>

            <h2 className="text-2xl font-bold mb-6 pr-8 flex items-center gap-3">
              <FaArrowDown className="text-red-600" />
              Registrar Nuevo Egreso
            </h2>

            {/* Información del egreso */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={nuevoEgreso.fecha}
                  onChange={(e) =>
                    setNuevoEgreso({ ...nuevoEgreso, fecha: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo Principal *
                </label>
                <select
                  value={nuevoEgreso.motivo}
                  onChange={(e) =>
                    setNuevoEgreso({ ...nuevoEgreso, motivo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                >
                  {Object.entries(MOTIVOS_EGRESO).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <input
                  type="text"
                  value={nuevoEgreso.observaciones}
                  onChange={(e) =>
                    setNuevoEgreso({
                      ...nuevoEgreso,
                      observaciones: e.target.value,
                    })
                  }
                  placeholder="Notas adicionales..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>

            {/* Agregar productos */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">
                Agregar Productos al Egreso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <SearchableSelect
                    options={productosDisponibles}
                    value={productoSeleccionado || ""}
                    onChange={(val) => setProductoSeleccionado(val || null)}
                    placeholder="Seleccionar producto..."
                    searchPlaceholder="Buscar por código o nombre..."
                    displayKey="label"
                    valueKey="value"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={cantidadAgregar}
                    onChange={(e) =>
                      setCantidadAgregar(parseInt(e.target.value) || 1)
                    }
                    placeholder="Cantidad"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <input
                    type="text"
                    value={motivoDetalle}
                    onChange={(e) => setMotivoDetalle(e.target.value)}
                    placeholder="Motivo específico (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={agregarProducto}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition cursor-pointer"
                  >
                    <FaPlus className="inline mr-1" /> Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de productos a egresar */}
            {nuevoEgreso.detalles.length > 0 ? (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Productos a Egresar ({nuevoEgreso.detalles.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Producto</th>
                        <th className="px-3 py-2 text-left">Código</th>
                        <th className="px-3 py-2 text-center">Stock Actual</th>
                        <th className="px-3 py-2 text-center">Cantidad</th>
                        <th className="px-3 py-2 text-right">P. Unitario</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                        <th className="px-3 py-2 text-left">Motivo</th>
                        <th className="px-3 py-2 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nuevoEgreso.detalles.map((detalle) => (
                        <tr
                          key={detalle.producto_id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-3 py-2 font-medium">
                            {detalle.producto.nombre}
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {detalle.producto.codigo_principal}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {detalle.producto.stock_actual}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              min="1"
                              max={detalle.producto.stock_actual}
                              value={detalle.cantidad}
                              onChange={(e) =>
                                actualizarCantidad(
                                  detalle.producto_id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-red-500 outline-none"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            ${parseFloat(detalle.precio_unitario).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-red-600">
                            ${parseFloat(detalle.subtotal).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-gray-500 text-sm">
                            {detalle.motivo_detalle || "-"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => quitarProducto(detalle.producto_id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            >
                              <FaTrashAlt />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 font-semibold">
                      <tr>
                        <td colSpan="3" className="px-3 py-2 text-right">
                          TOTALES:
                        </td>
                        <td className="px-3 py-2 text-center text-red-600">
                          {totalesEgreso.totalUnidades} unidades
                        </td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-right text-red-600">
                          ${totalesEgreso.valorTotal.toFixed(2)}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-8 text-center bg-gray-50 rounded-lg">
                <FaBox className="mx-auto text-4xl text-gray-300 mb-2" />
                <p className="text-gray-500">
                  No hay productos agregados. Busca y agrega productos arriba.
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={cerrarModalNuevo}
                className="px-6 py-2.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEgreso}
                disabled={saving || nuevoEgreso.detalles.length === 0}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FaArrowDown /> Registrar Egreso
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Egreso */}
      {modalDetalle && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
          onClick={() => setModalDetalle(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalDetalle(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <FaTimes className="text-lg" />
            </button>

            <h2 className="text-2xl font-bold mb-6 pr-8 flex items-center gap-3">
              <FaEye className="text-blue-600" />
              Detalle del Egreso #{modalDetalle.egreso_id}
            </h2>

            {/* Información general */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-semibold">
                  {new Date(modalDetalle.fecha).toLocaleDateString("es-EC")}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Motivo</p>
                <p className="font-semibold flex items-center gap-2">
                  {getIconoMotivo(modalDetalle.motivo)}
                  {MOTIVOS_EGRESO[modalDetalle.motivo]?.label}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Total Unidades</p>
                <p className="font-semibold text-red-600">
                  -{modalDetalle.total_unidades}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Valor Perdido</p>
                <p className="font-semibold text-red-600">
                  ${parseFloat(modalDetalle.valor_total || 0).toFixed(2)}
                </p>
              </div>
            </div>

            {modalDetalle.observaciones && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-700">
                  <strong>Observaciones:</strong> {modalDetalle.observaciones}
                </p>
              </div>
            )}

            {/* Lista de productos */}
            <h3 className="font-semibold text-gray-700 mb-3">
              Productos Egresados
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-left">Código</th>
                    <th className="px-3 py-2 text-center">Cantidad</th>
                    <th className="px-3 py-2 text-right">P. Unitario</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {modalDetalle.detalles?.map((detalle) => (
                    <tr
                      key={detalle.detalle_egreso_id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 font-medium">
                        {detalle.producto?.nombre || "Producto eliminado"}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {detalle.producto?.codigo_principal || "-"}
                      </td>
                      <td className="px-3 py-2 text-center text-red-600 font-semibold">
                        -{detalle.cantidad}
                      </td>
                      <td className="px-3 py-2 text-right">
                        ${parseFloat(detalle.precio_unitario || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-red-600">
                        ${parseFloat(detalle.subtotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Registrado por */}
            <div className="mt-6 pt-4 border-t text-sm text-gray-500">
              <p>
                <strong>Registrado por:</strong>{" "}
                {modalDetalle.usuario?.name || "Sistema"}
              </p>
              <p>
                <strong>Fecha de registro:</strong>{" "}
                {new Date(modalDetalle.created_at).toLocaleString("es-EC")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar Egreso"
          message={`¿Estás seguro de eliminar el egreso #${confirmDelete?.egreso_id}? Esta acción revertirá el stock de los productos afectados.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Eliminar y Revertir"
          confirmingText="Eliminando..."
          isLoading={deleting}
        />
      )}
    </div>
  );
}
