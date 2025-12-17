import { useState, useEffect, useMemo } from "react";
import { FaPlus, FaTimes, FaTrash, FaEye, FaBoxOpen, FaMoneyBillWave, FaShoppingCart, FaChartLine, FaSearch, FaEdit, FaCheck, FaSlidersH } from "react-icons/fa";
import api from "../services/api";
import { getErrorMessage } from "../utils/errorTranslator";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import SearchableSelect from "../components/SearchableSelect";
import DataTable from "../components/DataTable";
import useToast from "../hooks/useToast";

export default function Ingresos() {
  const toast = useToast();
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    compras_mes: 0,
    gasto_mes: 0,
    productos_recibidos: 0,
    total_historico: 0,
  });
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modal
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [saving, setSaving] = useState(false);

  // Búsqueda y paginación
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Visibilidad de columnas y menú
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    factura: true,
    fecha: true,
    proveedor: true,
    productos: true,
    total: true,
    acciones: true,
  });

  // Formulario de nueva compra
  const [form, setForm] = useState({
    proveedor_id: "",
    numero_factura_proveedor: "",
    fecha: new Date().toISOString().split("T")[0],
    detalles: [],
  });

  // Línea temporal para agregar productos
  const [nuevaLinea, setNuevaLinea] = useState({
    producto_id: "",
    cantidad: 1,
    precio_unitario: "",
    fecha_expiracion: "",
  });

  // Edición inline de líneas
  const [editandoLinea, setEditandoLinea] = useState(null); // índice de la línea en edición
  const [lineaEditada, setLineaEditada] = useState({ cantidad: "", precio_unitario: "", fecha_expiracion: "" });

  // Confirmación para eliminar línea del formulario
  const [confirmDeleteLinea, setConfirmDeleteLinea] = useState(null);

  // ============================
  // CARGAR DATOS
  // ============================
  const cargarCompras = async () => {
    setLoading(true);
    try {
      const res = await api.get("/compras");
      setCompras(res.data);
    } catch (error) {
      console.error("Error cargando compras:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const res = await api.get("/compras/estadisticas");
      setEstadisticas(res.data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  const cargarProveedores = async () => {
    try {
      const res = await api.get("/compras/proveedores");
      setProveedores(res.data);
    } catch (error) {
      console.error("Error cargando proveedores:", error);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await api.get("/productos");
      setProductos(res.data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  useEffect(() => {
    cargarCompras();
    cargarEstadisticas();
    cargarProveedores();
    cargarProductos();
  }, []);

  // ============================
  // FILTRADO Y PAGINACIÓN
  // ============================
  const comprasFiltradas = useMemo(() => {
    if (!search.trim()) return compras;
    const term = search.toLowerCase();
    return compras.filter((c) =>
      c.numero_factura_proveedor?.toLowerCase().includes(term) ||
      c.proveedor?.razon_social?.toLowerCase().includes(term) ||
      c.proveedor?.ruc?.toLowerCase().includes(term)
    );
  }, [compras, search]);

  const totalPages = Math.ceil(comprasFiltradas.length / itemsPerPage);
  const comprasPaginadas = comprasFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ============================
  // DEFINICIÓN DE COLUMNAS PARA DATATABLE
  // ============================
  const tableColumns = useMemo(() => {
    const cols = [];

    if (visibleCols.factura) {
      cols.push({
        accessorKey: "numero_factura_proveedor",
        header: "Factura",
        size: 180,
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-800">{getValue()}</span>
        ),
      });
    }

    if (visibleCols.fecha) {
      cols.push({
        accessorKey: "fecha",
        header: "Fecha",
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-gray-600">
            {new Date(getValue()).toLocaleDateString("es-EC")}
          </span>
        ),
      });
    }

    if (visibleCols.proveedor) {
      cols.push({
        accessorKey: "proveedor",
        header: "Proveedor",
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-800">
              {row.original.proveedor?.razon_social || "Sin proveedor"}
            </p>
            <p className="text-xs text-gray-500">{row.original.proveedor?.ruc}</p>
          </div>
        ),
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.proveedor?.razon_social || "";
          const b = rowB.original.proveedor?.razon_social || "";
          return a.localeCompare(b);
        },
      });
    }

    if (visibleCols.productos) {
      cols.push({
        accessorKey: "cantidad_productos",
        header: "Productos",
        size: 130,
        cell: ({ getValue }) => (
          <div className="text-center">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium">
              {getValue()} unidades
            </span>
          </div>
        ),
      });
    }

    if (visibleCols.total) {
      cols.push({
        accessorKey: "total",
        header: "Total",
        size: 120,
        cell: ({ getValue }) => (
          <div className="text-right font-semibold text-gray-800">
            ${parseFloat(getValue()).toFixed(2)}
          </div>
        ),
      });
    }

    if (visibleCols.acciones) {
      cols.push({
        id: "acciones",
        header: "Acciones",
        size: 100,
        enableSorting: false,
        enableResizing: false,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setDetailModal(row.original)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition cursor-pointer"
              title="Ver detalles"
            >
              <FaEye />
            </button>
            <button
              onClick={() => setConfirmDelete(row.original)}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer"
              title="Eliminar"
            >
              <FaTrash />
            </button>
          </div>
        ),
      });
    }

    return cols;
  }, [visibleCols]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // ============================
  // MODAL NUEVA COMPRA
  // ============================
  const abrirModal = () => {
    setForm({
      proveedor_id: "",
      numero_factura_proveedor: "",
      fecha: new Date().toISOString().split("T")[0],
      detalles: [],
    });
    setNuevaLinea({ producto_id: "", cantidad: 1, precio_unitario: "", fecha_expiracion: "" });
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
  };

  // ============================
  // MANEJO DE LÍNEAS DE PRODUCTOS
  // ============================
  const agregarLinea = () => {
    if (!nuevaLinea.producto_id || !nuevaLinea.cantidad || !nuevaLinea.precio_unitario) {
      toast.warning("Completa todos los campos del producto");
      return;
    }

    const producto = productos.find((p) => p.producto_id === parseInt(nuevaLinea.producto_id));
    if (!producto) return;

    const cantidad = parseInt(nuevaLinea.cantidad);
    const precioUnitario = parseFloat(nuevaLinea.precio_unitario);
    const subtotal = cantidad * precioUnitario;
    const ivaRate = producto.iva_aplica ? 0.15 : 0;
    const iva = subtotal * ivaRate;
    const total = subtotal + iva;

    const nuevaLineaCompleta = {
      producto_id: producto.producto_id,
      producto_nombre: producto.nombre,
      producto_codigo: producto.codigo_principal,
      cantidad,
      precio_unitario: precioUnitario,
      subtotal,
      iva,
      total,
      iva_aplica: producto.iva_aplica,
      fecha_expiracion: nuevaLinea.fecha_expiracion || null,
    };

    setForm((prev) => ({
      ...prev,
      detalles: [...prev.detalles, nuevaLineaCompleta],
    }));

    // Limpiar línea temporal
    setNuevaLinea({ producto_id: "", cantidad: 1, precio_unitario: "", fecha_expiracion: "" });
  };

  const eliminarLinea = (index) => {
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index),
    }));
    setConfirmDeleteLinea(null);
  };

  // Iniciar edición de una línea
  const iniciarEdicionLinea = (index) => {
    const linea = form.detalles[index];
    setEditandoLinea(index);
    setLineaEditada({
      cantidad: linea.cantidad.toString(),
      precio_unitario: linea.precio_unitario.toString(),
      fecha_expiracion: linea.fecha_expiracion || "",
    });
  };

  // Guardar edición de línea
  const guardarEdicionLinea = (index) => {
    const linea = form.detalles[index];
    const cantidad = parseInt(lineaEditada.cantidad) || 1;
    const precioUnitario = parseFloat(lineaEditada.precio_unitario) || 0;
    const subtotal = cantidad * precioUnitario;
    const ivaRate = linea.iva_aplica ? 0.15 : 0;
    const iva = subtotal * ivaRate;
    const total = subtotal + iva;

    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.map((d, i) =>
        i === index
          ? { ...d, cantidad, precio_unitario: precioUnitario, subtotal, iva, total, fecha_expiracion: lineaEditada.fecha_expiracion || null }
          : d
      ),
    }));
    setEditandoLinea(null);
    setLineaEditada({ cantidad: "", precio_unitario: "", fecha_expiracion: "" });
  };

  // Cancelar edición
  const cancelarEdicionLinea = () => {
    setEditandoLinea(null);
    setLineaEditada({ cantidad: "", precio_unitario: "", fecha_expiracion: "" });
  };

  const totalesCompra = useMemo(() => {
    const subtotal = form.detalles.reduce((acc, d) => acc + d.subtotal, 0);
    const iva = form.detalles.reduce((acc, d) => acc + d.iva, 0);
    const total = form.detalles.reduce((acc, d) => acc + d.total, 0);
    return { subtotal, iva, total };
  }, [form.detalles]);

  // ============================
  // GUARDAR COMPRA
  // ============================
  const guardarCompra = async () => {
    if (!form.proveedor_id) {
      toast.warning("Selecciona un proveedor");
      return;
    }
    if (!form.numero_factura_proveedor) {
      toast.warning("Ingresa el número de factura del proveedor");
      return;
    }
    if (form.detalles.length === 0) {
      toast.warning("Agrega al menos un producto");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        proveedor_id: form.proveedor_id,
        numero_factura_proveedor: form.numero_factura_proveedor,
        fecha: form.fecha,
        detalles: form.detalles.map((d) => ({
          producto_id: d.producto_id,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          fecha_expiracion: d.fecha_expiracion || null,
        })),
      };

      await api.post("/compras", payload);
      toast.success("Ingreso de stock registrado correctamente");
      cerrarModal();
      cargarCompras();
      cargarEstadisticas();
    } catch (error) {
      console.error("Error guardando compra:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // ELIMINAR COMPRA
  // ============================
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/compras/${confirmDelete.compra_id}`);
      toast.success("Compra eliminada y stock revertido");
      setConfirmDelete(null);
      cargarCompras();
      cargarEstadisticas();
    } catch (error) {
      console.error("Error eliminando compra:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  // ============================
  // AUTOCOMPLETAR PRECIO COSTO
  // ============================
  const handleProductoChange = (productoId) => {
    const producto = productos.find((p) => p.producto_id === parseInt(productoId));
    setNuevaLinea({
      ...nuevaLinea,
      producto_id: productoId,
      precio_unitario: producto?.precio_costo || "",
    });
  };

  // ============================
  // RENDER
  // ============================
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaBoxOpen className="text-blue-600" />
            Ingresos de Stock
          </h1>
          <p className="text-gray-500 mt-1">Gestiona las compras y reposición de inventario</p>
        </div>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition shadow-md cursor-pointer"
        >
          <FaPlus /> Nuevo Ingreso
        </button>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
            <FaShoppingCart className="text-xl" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Compras del mes</p>
            <p className="text-2xl font-bold text-gray-800">{estadisticas.compras_mes}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
          <div className="bg-green-100 text-green-600 p-3 rounded-full">
            <FaMoneyBillWave className="text-xl" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Gasto del mes</p>
            <p className="text-2xl font-bold text-gray-800">${estadisticas.gasto_mes.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
          <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
            <FaBoxOpen className="text-xl" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Productos recibidos</p>
            <p className="text-2xl font-bold text-gray-800">{estadisticas.productos_recibidos}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
          <div className="bg-orange-100 text-orange-600 p-3 rounded-full">
            <FaChartLine className="text-xl" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total histórico</p>
            <p className="text-2xl font-bold text-gray-800">${estadisticas.total_historico.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por factura, proveedor o RUC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* TABLA DE COMPRAS */}
      <div className="bg-white rounded-xl shadow-md p-5">
        {loading ? (
          <LoadingSpinner text="Cargando ingresos..." />
        ) : compras.length === 0 ? (
          <EmptyState
            icon={FaBoxOpen}
            title="No hay ingresos registrados"
            description="Registra tu primera compra para comenzar a gestionar el inventario"
          />
        ) : (
          <>
            {/* Filtro de columnas */}
            <div className="flex justify-end mb-3 relative">
              <button
                aria-label="Mostrar filtros de columnas"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 border border-gray-200 transition cursor-pointer"
                title="Mostrar/ocultar columnas"
                onClick={() => setShowColumnsMenu((v) => !v)}
              >
                <FaSlidersH className="text-base" />
                <span className="text-sm">Columnas</span>
              </button>
              {showColumnsMenu && (
                <div className="absolute right-0 top-11 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-20 w-60">
                  <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wide">Columnas visibles</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.factura}
                        onChange={(e) => setVisibleCols({ ...visibleCols, factura: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Factura
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.fecha}
                        onChange={(e) => setVisibleCols({ ...visibleCols, fecha: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Fecha
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.proveedor}
                        onChange={(e) => setVisibleCols({ ...visibleCols, proveedor: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Proveedor
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.productos}
                        onChange={(e) => setVisibleCols({ ...visibleCols, productos: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Productos
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.total}
                        onChange={(e) => setVisibleCols({ ...visibleCols, total: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Total
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.acciones}
                        onChange={(e) => setVisibleCols({ ...visibleCols, acciones: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Acciones
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* DataTable con TanStack */}
            <DataTable
              columns={tableColumns}
              data={comprasPaginadas}
              loading={false}
              emptyIcon={FaBoxOpen}
              emptyTitle="Sin ingresos"
              emptyDescription="No hay ingresos que coincidan con la búsqueda"
              enableSorting={true}
              getRowId={(row) => row.compra_id}
            />
          </>
        )}

        {comprasFiltradas.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* MODAL NUEVA COMPRA */}
      {modal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
          onClick={cerrarModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto overflow-x-visible"
            onClick={(e) => e.stopPropagation()}
            style={{ overflowY: "auto", overflowX: "visible" }}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              onClick={cerrarModal}
            >
              <FaTimes className="text-lg" />
            </button>

            <h2 className="text-2xl font-bold mb-6 pr-8">Nuevo Ingreso de Stock</h2>

            {/* DATOS DE LA COMPRA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor *
                </label>
                <select
                  value={form.proveedor_id}
                  onChange={(e) => setForm({ ...form, proveedor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.proveedor_id} value={p.proveedor_id}>
                      {p.razon_social} ({p.ruc})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  N° Factura Proveedor *
                </label>
                <input
                  type="text"
                  value={form.numero_factura_proveedor}
                  onChange={(e) => setForm({ ...form, numero_factura_proveedor: e.target.value })}
                  placeholder="Ej: 001-001-000000123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* AGREGAR PRODUCTO */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Agregar Producto</h3>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SearchableSelect
                    options={productos.map((p) => ({
                      value: p.producto_id.toString(),
                      label: `[${p.codigo_principal}] ${p.nombre}`,
                      producto: p,
                    }))}
                    value={nuevaLinea.producto_id}
                    onChange={(val) => handleProductoChange(val)}
                    placeholder="Seleccionar producto"
                    searchPlaceholder="Buscar por código o nombre..."
                    displayKey="label"
                    valueKey="value"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="1"
                      value={nuevaLinea.cantidad}
                      onChange={(e) => setNuevaLinea({ ...nuevaLinea, cantidad: e.target.value })}
                      placeholder="Cantidad"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={nuevaLinea.precio_unitario}
                      onChange={(e) => setNuevaLinea({ ...nuevaLinea, precio_unitario: e.target.value })}
                      placeholder="Precio costo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Fecha de expiración (opcional)
                    </label>
                    <input
                      type="date"
                      value={nuevaLinea.fecha_expiracion}
                      onChange={(e) => setNuevaLinea({ ...nuevaLinea, fecha_expiracion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <button
                    onClick={agregarLinea}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 font-medium"
                  >
                    <FaPlus /> Agregar Producto
                  </button>
                </div>
              </div>
            </div>

            {/* TABLA DE PRODUCTOS AGREGADOS */}
            {form.detalles.length > 0 && (
              <div className="border rounded-lg overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr className="text-gray-600">
                        <th className="px-4 py-3 text-left">Producto</th>
                        <th className="px-4 py-3 text-center">Cantidad</th>
                        <th className="px-4 py-3 text-right">P. Unitario</th>
                        <th className="px-4 py-3 text-center">Expiración</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                        <th className="px-4 py-3 text-right">IVA</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.detalles.map((linea, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{linea.producto_nombre}</p>
                              <p className="text-xs text-gray-500">{linea.producto_codigo}</p>
                            </div>
                          </td>
                          {editandoLinea === idx ? (
                            <>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={lineaEditada.cantidad}
                                  onChange={(e) => setLineaEditada({ ...lineaEditada, cantidad: e.target.value })}
                                  className="w-20 px-2 py-1 border border-blue-400 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  autoFocus
                                />
                              </td>
                              <td className="px-4 py-2 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={lineaEditada.precio_unitario}
                                  onChange={(e) => setLineaEditada({ ...lineaEditada, precio_unitario: e.target.value })}
                                  className="w-24 px-2 py-1 border border-blue-400 rounded text-right text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="date"
                                  value={lineaEditada.fecha_expiracion}
                                  onChange={(e) => setLineaEditada({ ...lineaEditada, fecha_expiracion: e.target.value })}
                                  className="w-32 px-2 py-1 border border-blue-400 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-gray-400">-</td>
                              <td className="px-4 py-3 text-right text-gray-400">-</td>
                              <td className="px-4 py-3 text-right text-gray-400">-</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center gap-1">
                                  <button
                                    onClick={() => guardarEdicionLinea(idx)}
                                    className="text-green-600 hover:bg-green-100 p-1.5 rounded transition cursor-pointer"
                                    title="Guardar"
                                  >
                                    <FaCheck />
                                  </button>
                                  <button
                                    onClick={cancelarEdicionLinea}
                                    className="text-gray-600 hover:bg-gray-100 p-1.5 rounded transition cursor-pointer"
                                    title="Cancelar"
                                  >
                                    <FaTimes />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-center">{linea.cantidad}</td>
                              <td className="px-4 py-3 text-right">${linea.precio_unitario.toFixed(2)}</td>
                              <td className="px-4 py-3 text-center">
                                {linea.fecha_expiracion 
                                  ? new Date(linea.fecha_expiracion).toLocaleDateString("es-EC") 
                                  : <span className="text-gray-400">-</span>}
                              </td>
                              <td className="px-4 py-3 text-right">${linea.subtotal.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right">
                                {linea.iva_aplica ? `$${linea.iva.toFixed(2)}` : "-"}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold">${linea.total.toFixed(2)}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center gap-1">
                                  <button
                                    onClick={() => iniciarEdicionLinea(idx)}
                                    className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition cursor-pointer"
                                    title="Editar"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteLinea(idx)}
                                    className="text-red-600 hover:bg-red-100 p-1.5 rounded transition cursor-pointer"
                                    title="Eliminar"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TOTALES */}
            {form.detalles.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-end gap-8">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="text-lg font-semibold">${totalesCompra.subtotal.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">IVA (15%)</p>
                    <p className="text-lg font-semibold">${totalesCompra.iva.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-blue-600">${totalesCompra.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* BOTONES */}
            <div className="flex gap-3">
              <button
                onClick={guardarCompra}
                disabled={saving || form.detalles.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition cursor-pointer disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "Confirmar Ingreso"}
              </button>
              <button
                onClick={cerrarModal}
                className="px-6 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {detailModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
          onClick={() => setDetailModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              onClick={() => setDetailModal(null)}
            >
              <FaTimes className="text-lg" />
            </button>

            <h2 className="text-2xl font-bold mb-6 pr-8">
              Detalle de Compra #{detailModal.numero_factura_proveedor}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-500">Proveedor</p>
                <p className="font-semibold">{detailModal.proveedor?.razon_social}</p>
                <p className="text-gray-600">{detailModal.proveedor?.ruc}</p>
              </div>
              <div>
                <p className="text-gray-500">Fecha</p>
                <p className="font-semibold">
                  {new Date(detailModal.fecha).toLocaleDateString("es-EC", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr className="text-gray-600">
                    <th className="px-4 py-3 text-left">Producto</th>
                    <th className="px-4 py-3 text-center">Cantidad</th>
                    <th className="px-4 py-3 text-right">P. Unitario</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-right">IVA</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModal.detalles?.map((d, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-medium">{d.producto?.nombre}</p>
                        <p className="text-xs text-gray-500">{d.producto?.codigo_principal}</p>
                      </td>
                      <td className="px-4 py-3 text-center">{d.cantidad}</td>
                      <td className="px-4 py-3 text-right">${parseFloat(d.precio_unitario).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">${parseFloat(d.subtotal).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">${parseFloat(d.iva).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold">${parseFloat(d.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 flex justify-end">
              <div className="text-right">
                <p className="text-gray-500 text-sm">Total de la Compra</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${parseFloat(detailModal.total).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar Compra"
          message={`¿Estás seguro de eliminar la compra "${confirmDelete?.numero_factura_proveedor || ''}"? Esta acción revertirá el stock de los productos.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          isLoading={deleting}
          confirmText="Eliminar"
          cancelText="Cancelar"
          confirmColor="red"
        />
      )}

      {/* CONFIRMACIÓN DE ELIMINACIÓN DE LÍNEA */}
      {confirmDeleteLinea !== null && (
        <ConfirmDialog
          title="Eliminar Producto"
          message={`¿Estás seguro de eliminar "${form.detalles[confirmDeleteLinea]?.producto_nombre || 'este producto'}" de la lista?`}
          onConfirm={() => eliminarLinea(confirmDeleteLinea)}
          onCancel={() => setConfirmDeleteLinea(null)}
          confirmText="Eliminar"
          cancelText="Cancelar"
          confirmColor="red"
        />
      )}
    </div>
  );
}