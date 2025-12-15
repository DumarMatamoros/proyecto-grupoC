import { useState, useEffect } from "react";
import { FaBox, FaPlus, FaEdit, FaTrash, FaTimes, FaFileImport, FaSlidersH } from "react-icons/fa";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ImageWithFallback from "../components/ImageWithFallback";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import useToast from "../hooks/useToast";

export default function InventoryPage() {
  const toast = useToast();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importModal, setImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importUploading, setImportUploading] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    imagen: true,
    codigo: true,
    codigo_barras: true,
    descripcion: true,
    categoria: true,
    stock: true,
    precio_costo: true,
    precio_venta: true,
    iva: true,
    ice: true,
  });

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [form, setForm] = useState({
    codigo_principal: "",
    nombre: "",
    descripcion: "",
    precio_unitario: "",
    stock_actual: "",
    categoria_id: "",
    imagen: null,
    iva_aplica: 0,
    ice_aplica: 0,
  });

  // ============================
  // CARGAR DATOS
  // ============================
  const cargarProductos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/productos");
      setProductos(res.data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const res = await api.get("/categorias");
      setCategorias(res.data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);

  // ============================
  // INPUTS
  // ============================
  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;

    if (type === "file" && files.length > 0) {
      const file = files[0];
      setForm({ ...form, imagen: file });
      setPreview(URL.createObjectURL(file));
      return;
    }

    if (type === "checkbox") {
      setForm({ ...form, [name]: checked ? 1 : 0 });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  // ============================
  // DRAG & DROP
  // ============================
  const handleDrag = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      setForm({ ...form, imagen: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  // ============================
  // NUEVO PRODUCTO
  // ============================
  const abrirNuevo = () => {
    setEditing(null);
    setForm({
      codigo_principal: "",
      nombre: "",
      descripcion: "",
      precio_unitario: "",
      stock_actual: "",
      categoria_id: "",
      imagen: null,
      iva_aplica: 0,
      ice_aplica: 0,
    });
    setPreview(null);
    setModal(true);
  };

  // ============================
  // IMPORTACIÓN MASIVA
  // ============================
  const openImport = () => {
    setImportModal(true);
    setImportPreview(null);
  };

  const uploadPreview = async (file) => {
    if (!file) return;
    try {
      setImportUploading(true);
      const formData = new FormData();
      formData.append('archivo', file);
      const res = await api.post('/productos/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportPreview(res.data);
      toast.info(`Se detectaron ${res.data.count} filas`);
    } catch (error) {
      console.error('Error en previsualización:', error);
      toast.error(error.response?.data?.message || 'Error al previsualizar');
    } finally {
      setImportUploading(false);
    }
  };

  const confirmImport = async () => {
    if (!importPreview?.preview?.length) return;
    try {
      setImportUploading(true);
      const res = await api.post('/productos/import/confirm', { rows: importPreview.preview });
      toast.success(`Importación: creados ${res.data.created}, actualizados ${res.data.updated}`);
      if (res.data.errors?.length) {
        toast.warning(`Errores: ${res.data.errors.length}`);
      }
      setImportModal(false);
      setImportPreview(null);
      cargarProductos();
    } catch (error) {
      console.error('Error confirmando importación:', error);
      toast.error(error.response?.data?.message || 'Error al confirmar importación');
    } finally {
      setImportUploading(false);
    }
  };

  // ============================
  // EDITAR PRODUCTO
  // ============================
  const abrirEditar = (p) => {
    setEditing(p.producto_id);
    setForm({
      codigo_principal: p.codigo_principal,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio_unitario: p.precio_unitario,
      stock_actual: p.stock_actual,
      categoria_id: p.categoria_id || "",
      iva_aplica: p.iva_aplica ? 1 : 0,
      ice_aplica: p.ice_aplica ? 1 : 0,
      imagen: null,
    });

    setPreview(p.imagen ? `http://127.0.0.1:8000/storage/${p.imagen}` : null);
    setModal(true);
  };

  // ============================
  // CREAR O ACTUALIZAR
  // ============================
  const guardarProducto = async () => {
        const data = new FormData();

        // Agregar cada campo EXCEPTO imagen si está vacía
        Object.keys(form).forEach((key) => {
          if (key === "imagen") {
            // Solo enviar imagen si se seleccionó una nueva
            if (form.imagen instanceof File) {
              data.append("imagen", form.imagen);
            }
          } else {
            data.append(key, form[key]);
          }
        });

        // Forzar valores válidos para Laravel
        data.set("iva_aplica", form.iva_aplica ? 1 : 0);
        data.set("ice_aplica", form.ice_aplica ? 1 : 0);

        try {
          if (editing) {
            data.append("_method", "PUT");

            await api.post(`/productos/${editing}`, data, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Producto actualizado correctamente");
          } else {
            await api.post(`/productos`, data, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Producto creado correctamente");
          }

          setModal(false);
          cargarProductos();

        } catch (error) {
          console.error("Error:", error.response?.data || error);
          toast.error(error.response?.data?.message || "Ocurrió un error al guardar");
        }
      };

  // ============================
  // ELIMINAR
  // ============================
  const eliminarProducto = async (id) => {
    setConfirmDelete(id);
  };

  const confirmarEliminar = async () => {
    try {
      setDeleting(true);
      await api.delete(`/productos/${confirmDelete}`);
      toast.success("Producto eliminado correctamente");
      setConfirmDelete(null);
      cargarProductos();
    } catch (error) {
      console.error("Error eliminando producto:", error);
      toast.error(error.response?.data?.message || "Error al eliminar producto");
    } finally {
      setDeleting(false);
    }
  };

  // ============================
  // BUSCADOR
  // ============================
  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo_principal.toLowerCase().includes(search.toLowerCase())
  );

  // ============================
  // VISTA
  // ============================
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaBox className="text-blue-600" />
          Gestión de Productos
        </h1>
      </div>

      {/* BUSCADOR Y BOTÓN */}
      <div className="flex gap-4 mb-5">
        <input
          placeholder="🔍 Buscar por nombre o código..."
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
        >
          <FaPlus /> Agregar Producto
        </button>
        <button
          onClick={openImport}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
        >
          <FaFileImport /> Importar CSV
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-lg p-5">
        {loading ? (
          <LoadingSpinner text="Cargando productos..." />
        ) : productos.length === 0 ? (
          <EmptyState
            icon={FaBox}
            title="Sin productos"
            description="No hay productos registrados"
          />
        ) : (
          <>
            {/* Menú de columnas FUERA del scroll */}
            <div className="flex justify-end mb-2 relative">
              <button
                aria-label="Mostrar filtros de columnas"
                className="p-2 rounded hover:bg-gray-100 text-gray-600"
                title="Mostrar/ocultar columnas"
                onClick={() => setShowColumnsMenu((v) => !v)}
              >
                <FaSlidersH className="text-base" />
              </button>
              {showColumnsMenu && (
                <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 w-56">
                  <p className="text-xs text-gray-500 mb-2">Columnas visibles</p>
                <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCols.imagen}
                    onChange={(e) => setVisibleCols({ ...visibleCols, imagen: e.target.checked })}
                  />
                  Imagen
                </label>
                <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCols.codigo}
                    onChange={(e) => setVisibleCols({ ...visibleCols, codigo: e.target.checked })}
                  />
                  Código
                </label>
                <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCols.codigo_barras}
                    onChange={(e) => setVisibleCols({ ...visibleCols, codigo_barras: e.target.checked })}
                  />
                  Código de Barras
                </label>
                <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCols.descripcion}
                    onChange={(e) => setVisibleCols({ ...visibleCols, descripcion: e.target.checked })}
                  />
                  Descripción
                </label>
                <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCols.categoria}
                    onChange={(e) => setVisibleCols({ ...visibleCols, categoria: e.target.checked })}
                  />
                  Categoría
                </label>
                <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCols.stock}
                    onChange={(e) => setVisibleCols({ ...visibleCols, stock: e.target.checked })}
                  />
                  Stock
                </label>
                <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCols.precio_costo}
                    onChange={(e) => setVisibleCols({ ...visibleCols, precio_costo: e.target.checked })}
                  />
                  Precio de Costo
                </label>
                <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCols.precio_venta}
                    onChange={(e) => setVisibleCols({ ...visibleCols, precio_venta: e.target.checked })}
                  />
                  Precio de Venta
                </label>
                <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCols.iva}
                    onChange={(e) => setVisibleCols({ ...visibleCols, iva: e.target.checked })}
                  />
                  IVA
                </label>
                <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCols.ice}
                    onChange={(e) => setVisibleCols({ ...visibleCols, ice: e.target.checked })}
                  />
                  ICE
                </label>
                </div>
              )}
            </div>

            {/* Tabla responsiva que escala al contenedor */}
            <div className="w-full">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
                    {visibleCols.imagen && <th className="px-2 py-2 w-14">Imagen</th>}
                    {visibleCols.codigo && <th className="px-2 py-2">Código</th>}
                    {visibleCols.codigo_barras && (
                      <th className="px-2 py-2">Cód. Barras</th>
                    )}
                    <th className="px-2 py-2">Nombre</th>
                    {visibleCols.descripcion && <th className="px-2 py-2">Descripción</th>}
                    {visibleCols.categoria && <th className="px-2 py-2">Categoría</th>}
                  {visibleCols.stock && <th className="px-2 py-2 w-16 text-center">Stock</th>}
                  {visibleCols.precio_costo && (
                    <th className="px-2 py-2 w-20">P. Costo</th>
                  )}
                  {visibleCols.precio_venta && (
                    <th className="px-2 py-2 w-20">P. Venta</th>
                  )}
                  {visibleCols.iva && <th className="px-2 py-2 w-12 text-center">IVA</th>}
                  {visibleCols.ice && <th className="px-2 py-2 w-12 text-center">ICE</th>}
                  <th className="px-2 py-2 w-24 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {productos
                  .filter(
                    (p) =>
                      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
                      p.codigo_principal
                        .toLowerCase()
                        .includes(search.toLowerCase())
                  )
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((p) => (
                    <tr
                      key={p.producto_id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      {visibleCols.imagen && (
                        <td className="px-2 py-2">
                          <ImageWithFallback
                            src={
                              p.imagen
                                ? `http://127.0.0.1:8000/storage/${p.imagen}`
                                : null
                            }
                            className="w-10 h-10 object-cover rounded"
                          />
                        </td>
                      )}

                      {visibleCols.codigo && (
                        <td className="px-2 py-2 font-medium text-sm truncate">{p.codigo_principal}</td>
                      )}
                      {visibleCols.codigo_barras && (
                        <td className="px-2 py-2 text-sm truncate">{p.codigo_barras ?? "-"}</td>
                      )}
                      <td className="px-2 py-2 text-sm truncate">{p.nombre}</td>
                      {visibleCols.descripcion && (
                        <td className="px-2 py-2 text-gray-600 text-sm truncate">{p.descripcion || "-"}</td>
                      )}
                      {visibleCols.categoria && (
                        <td className="px-2 py-2 text-sm truncate">{p.categoria?.nombre ?? "Sin categoría"}</td>
                      )}
                      {visibleCols.stock && (
                        <td className="px-2 py-2 text-center text-sm">{p.stock_actual}</td>
                      )}
                      {visibleCols.precio_costo && (
                        <td className="px-2 py-2 text-sm">${p.precio_costo ?? "0.00"}</td>
                      )}
                      {visibleCols.precio_venta && (
                        <td className="px-2 py-2 text-sm">${p.precio_unitario}</td>
                      )}
                      {visibleCols.iva && (
                        <td className="px-2 py-2 text-center text-sm">{p.iva_aplica ? "✓" : "✗"}</td>
                      )}
                      {visibleCols.ice && (
                        <td className="px-2 py-2 text-center text-sm">{p.ice_aplica ? "✓" : "✗"}</td>
                      )}

                      <td className="px-2 py-2">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => abrirEditar(p)}
                            className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                            title="Editar"
                          >
                            <FaEdit className="text-sm" />
                          </button>

                          <button
                            onClick={() => eliminarProducto(p.producto_id)}
                            className="w-8 h-8 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded transition"
                            title="Eliminar"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
              </table>
            </div>
          </>
        )}
        {productos.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(
              productos.filter(
                (p) =>
                  p.nombre.toLowerCase().includes(search.toLowerCase()) ||
                  p.codigo_principal.toLowerCase().includes(search.toLowerCase())
              ).length / itemsPerPage
            )}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      
      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar Producto"
          message="¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer."
          onConfirm={confirmarEliminar}
          onCancel={() => setConfirmDelete(null)}
          isLoading={deleting}
        />
      )}

      
      {importModal && (
        <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition"
              onClick={() => setImportModal(false)}
              title="Cerrar"
            >
              <FaTimes className="text-base sm:text-lg" />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 lg:mb-8 pr-8">Importación de Productos (CSV)</h2>

            {!importPreview && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Seleccionar archivo CSV para previsualizar:
                  </label>
                  <div
                    className="w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition cursor-pointer flex items-center justify-center bg-gray-50 hover:bg-blue-50"
                    onClick={() => document.getElementById("csvInput").click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files[0]) {
                        uploadPreview(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <div className="text-center text-gray-500">
                      <div className="text-lg font-semibold">Arrastre o seleccione un archivo</div>
                      <div className="text-sm mt-2">Formatos: CSV</div>
                    </div>
                  </div>
                  <input
                    id="csvInput"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => uploadPreview(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-3 font-semibold">Formato esperado:</p>
                  <p className="text-xs text-gray-600 font-mono break-all bg-white p-3 rounded border border-gray-200">
                    codigo_principal,nombre,descripcion,precio_unitario,stock_actual,categoria_nombre,iva_aplica,ice_aplica
                  </p>
                  <p className="text-xs text-gray-600 mt-3">
                    <strong>Nota:</strong> Usa 0 o 1 para iva_aplica e ice_aplica. Las categorías se crearán automáticamente si no existen.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-xs text-gray-700">
                    <strong>💡 Consejo:</strong> Los productos se actualizarán si el código_principal ya existe, o se crearán si es nuevo.
                  </p>
                </div>

                {importUploading && (
                  <div className="text-center py-4">
                    <p className="text-gray-600">Cargando archivo...</p>
                  </div>
                )}
              </div>
            )}

            {importPreview && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Se detectaron <span className="font-bold text-blue-600">{importPreview.count}</span> productos para importar:
                  </p>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0">
                        <tr className="bg-gray-100 text-gray-700 uppercase text-sm font-semibold">
                          <th className="px-4 py-3 border-r">Código</th>
                          <th className="px-4 py-3 border-r">Nombre</th>
                          <th className="px-4 py-3 border-r">Descripción</th>
                          <th className="px-4 py-3 border-r">Categoría</th>
                          <th className="px-4 py-3 border-r">Stock</th>
                          <th className="px-4 py-3 border-r">Precio</th>
                          <th className="px-4 py-3 border-r">IVA</th>
                          <th className="px-4 py-3">ICE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.preview.map((r, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 border-r text-sm font-medium">{r.codigo_principal || "-"}</td>
                            <td className="px-4 py-2 border-r text-sm">{r.nombre || "-"}</td>
                            <td className="px-4 py-2 border-r text-sm text-gray-600 max-w-xs truncate">{r.descripcion || "-"}</td>
                            <td className="px-4 py-2 border-r text-sm">{r.categoria_nombre || "Sin categoría"}</td>
                            <td className="px-4 py-2 border-r text-sm text-center">{r.stock_actual || "0"}</td>
                            <td className="px-4 py-2 border-r text-sm">${r.precio_unitario || "0.00"}</td>
                            <td className="px-4 py-2 border-r text-sm text-center">{r.iva_aplica ? "✓" : "✗"}</td>
                            <td className="px-4 py-2 text-sm text-center">{r.ice_aplica ? "✓" : "✗"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={confirmImport}
                    disabled={importUploading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importUploading ? "Importando..." : "Confirmar Importación"}
                  </button>
                  <button
                    onClick={() => setImportModal(false)}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}>
          <div
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className="bg-white rounded-lg sm:rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition"
              onClick={() => setModal(false)}
              title="Cerrar"
            >
              <FaTimes className="text-base sm:text-lg" />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 lg:mb-8 pr-8">
              {editing ? "Editar Producto" : "Nuevo Producto"}
            </h2>

            {/* PREVIEW */}
            <div
              className={`w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mx-auto mb-4 sm:mb-6 lg:mb-8 rounded-lg sm:rounded-xl border-2 flex items-center justify-center cursor-pointer transition ${
                dragActive
                  ? "bg-blue-50 border-blue-400"
                  : "bg-gray-50 border-gray-300 border-dashed"
              }`}
              onClick={() => document.getElementById("inputFile").click()}
            >
              {preview ? (
                <img
                  src={preview}
                  className="w-full h-full rounded-lg sm:rounded-xl object-cover"
                />
              ) : (
                <div className="text-center text-gray-500 px-2">
                  <div className="text-xs sm:text-sm">Arrastre o seleccione un archivo</div>
                </div>
              )}
            </div>

            <input
              id="inputFile"
              type="file"
              name="imagen"
              className="hidden"
              onChange={handleChange}
            />

            {/* FORM */}
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    name="codigo_principal"
                    placeholder="Código único del producto"
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                    onChange={handleChange}
                    value={form.codigo_principal}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    name="nombre"
                    placeholder="Nombre del producto"
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                    onChange={handleChange}
                    value={form.nombre}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Precio</label>
                  <input
                    name="precio_unitario"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                    onChange={handleChange}
                    value={form.precio_unitario}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    name="stock_actual"
                    placeholder="0"
                    type="number"
                    disabled={editing ? true : false}
                    className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base ${
                      editing ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                    }`}
                    onChange={handleChange}
                    value={form.stock_actual}
                    title={editing ? "El stock solo se modifica desde Ingresar/Deshechar" : ""}
                  />
                  {editing && <p className="text-xs text-gray-500 mt-1">Los cambios de stock se realizan desde Ingresar/Deshechar</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  name="categoria_id"
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                  onChange={handleChange}
                  value={form.categoria_id}
                >
                  <option value="">Seleccione categoría (opcional)</option>
                  {categorias.map((c) => (
                    <option key={c.categoria_id} value={c.categoria_id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  placeholder="Descripción del producto"
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                  rows="3"
                  onChange={handleChange}
                  value={form.descripcion}
                />
              </div>

              {/* CHECKBOXES MEJORADOS */}
              <div className="border-t pt-4 space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="iva_aplica"
                    checked={form.iva_aplica === 1}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">Aplica IVA</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="ice_aplica"
                    checked={form.ice_aplica === 1}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">Aplica ICE</span>
                </label>
              </div>
            </div>

            {/* BOTONES */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 lg:mt-8">
              <button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 sm:py-3 rounded-lg font-semibold transition disabled:opacity-50 text-sm sm:text-base"
                onClick={guardarProducto}
              >
                {editing ? "Actualizar Producto" : "Guardar Producto"}
              </button>

              <button
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold transition text-sm sm:text-base"
                onClick={() => setModal(false)}
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
