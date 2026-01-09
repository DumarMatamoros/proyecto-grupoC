import { useEffect, useState, useMemo } from "react";
import { FaTags, FaPlus, FaEdit, FaTrash, FaTimes, FaBan, FaCheck, FaExclamationTriangle, FaFileImport, FaDownload, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import api from "../services/api";
import { getErrorMessage } from "../utils/errorTranslator";
import { CATEGORY_LIMITS } from "../utils/validationLimits";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import useToast from "../hooks/useToast";

export default function Categoria() {
  const toast = useToast();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(null); // Para mostrar opciones cuando tiene productos
  const [togglingEstado, setTogglingEstado] = useState(null); // ID de categoría que está cambiando estado
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [initialForm, setInitialForm] = useState({ nombre: "", descripcion: "" });
  const [importModal, setImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importUploading, setImportUploading] = useState(false);
  const itemsPerPage = 10;

  const cargarCategorias = async () => {
    setLoading(true);
    try {
      const res = await api.get("/categorias");
      setCategorias(res.data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const guardarCategoria = async () => {
    if (!nombre.trim()) {
      toast.warning("El nombre es obligatorio");
      return;
    }

    try {
      setLoading(true);
      if (editing) {
        await api.put(`/categorias/${editing}`, { nombre, descripcion });
        toast.success("Categoría actualizada correctamente");
      } else {
        await api.post("/categorias", { nombre, descripcion });
        toast.success("Categoría guardada correctamente");
      }
      cerrarModal();
      cargarCategorias();
    } catch (error) {
      console.error("Error guardando categoría:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const eliminarCategoria = async (id) => {
    setConfirmDelete(id);
  };

  const confirmarEliminar = async (forzar = false) => {
    try {
      setDeleting(true);
      const url = forzar ? `/categorias/${confirmDelete}?forzar=1` : `/categorias/${confirmDelete}`;
      await api.delete(url);
      toast.success("Categoría eliminada correctamente");
      setConfirmDelete(null);
      setShowDeleteOptions(null);
      cargarCategorias();
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      // Si el error indica que tiene productos, mostrar opciones
      if (error.response?.data?.tiene_relaciones) {
        setShowDeleteOptions(confirmDelete);
        setConfirmDelete(null);
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setDeleting(false);
    }
  };

  // Eliminar forzadamente (desvincula productos)
  const eliminarForzado = async () => {
    try {
      setDeleting(true);
      await api.delete(`/categorias/${showDeleteOptions}?forzar=1`);
      toast.success("Categoría eliminada completamente");
      setShowDeleteOptions(null);
      cargarCategorias();
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  // Desactivar categoría
  const desactivarCategoria = async () => {
    try {
      setDeleting(true);
      await api.patch(`/categorias/${showDeleteOptions}/estado`);
      toast.success("Categoría desactivada correctamente");
      setShowDeleteOptions(null);
      cargarCategorias();
    } catch (error) {
      console.error("Error desactivando categoría:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  // Cambiar estado (activar/desactivar) desde botón directo
  const toggleEstado = async (id) => {
    try {
      setTogglingEstado(id);
      const response = await api.patch(`/categorias/${id}/estado`);
      toast.success(response.data.message);
      cargarCategorias();
    } catch (error) {
      console.error("Error cambiando estado:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setTogglingEstado(null);
    }
  };

  const abrirNuevo = () => {
    setEditing(null);
    setNombre("");
    setDescripcion("");
    setInitialForm({ nombre: "", descripcion: "" });
    setModal(true);
  };

  const abrirEditar = (cat) => {
    setEditing(cat.categoria_id || cat.id);
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion || "");
    setInitialForm({ nombre: cat.nombre, descripcion: cat.descripcion || "" });
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
    setEditing(null);
    setNombre("");
    setDescripcion("");
  };

  // ============================
  // DETECTAR CAMBIOS EN FORMULARIO
  // ============================
  const hasFormChanges = () => {
    return nombre !== initialForm.nombre || descripcion !== initialForm.descripcion;
  };

  const handleCloseModal = () => {
    if (hasFormChanges()) {
      setConfirmDiscard(true);
    } else {
      cerrarModal();
    }
  };

  const handleConfirmDiscard = () => {
    setConfirmDiscard(false);
    cerrarModal();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  // ============================
  // IMPORTACIÓN MASIVA
  // ============================
  const openImport = () => {
    setImportModal(true);
    setImportPreview(null);
  };

  const handleCloseImportModal = () => {
    setImportModal(false);
    setImportPreview(null);
  };

  const handleImportBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseImportModal();
    }
  };

  const uploadPreview = async (file) => {
    if (!file) return;
    try {
      setImportUploading(true);
      const formData = new FormData();
      formData.append('archivo', file);
      const res = await api.post('/categorias/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportPreview(res.data);
      toast.info(`Se detectaron ${res.data.count} categorías`);
    } catch (error) {
      console.error('Error en previsualización:', error);
      toast.error(getErrorMessage(error) || 'Error al previsualizar');
    } finally {
      setImportUploading(false);
    }
  };

  const confirmImport = async () => {
    if (!importPreview?.preview?.length) return;
    try {
      setImportUploading(true);
      const res = await api.post('/categorias/import/confirm', { rows: importPreview.preview });
      toast.success(`Importación: creadas ${res.data.created}, actualizadas ${res.data.updated}`);
      if (res.data.errors?.length) {
        toast.warning(`Errores: ${res.data.errors.length}`);
      }
      setImportModal(false);
      setImportPreview(null);
      cargarCategorias();
    } catch (error) {
      console.error('Error confirmando importación:', error);
      toast.error(getErrorMessage(error) || 'Error al confirmar importación');
    } finally {
      setImportUploading(false);
    }
  };

  // ============================
  // DESCARGAR PLANTILLA EXCEL
  // ============================
  const descargarPlantillaExcel = () => {
    const datosPlantilla = [
      ['📋 PLANTILLA DE IMPORTACIÓN DE CATEGORÍAS - Complete los datos desde la fila 4'],
      ['⚠️ NO modificar los encabezados de la fila 3. El campo Nombre es obligatorio.'],
      [],
      ['Nombre *', 'Descripción'],
      ['Bebidas', 'Categoría para todo tipo de bebidas'],
      ['Snacks', 'Bocadillos y aperitivos'],
      ['Lácteos', 'Productos derivados de la leche'],
      ['Limpieza', 'Productos de aseo y limpieza del hogar'],
      ['Carnes', 'Carnes frescas y embutidos'],
    ];

    const instrucciones = [
      ['📘 GUÍA DE CAMPOS'],
      [],
      ['Campo', 'Obligatorio', 'Descripción', 'Ejemplo'],
      ['Nombre', 'SÍ', 'Nombre único de la categoría', 'Bebidas'],
      ['Descripción', 'NO', 'Descripción detallada de la categoría', 'Categoría para bebidas'],
      [],
      ['💡 CONSEJOS:'],
      ['• Si el nombre ya existe, se actualizará la descripción'],
      ['• Las categorías se crean con estado "activo" por defecto'],
      ['• Puedes dejar la descripción vacía'],
    ];

    const wb = XLSX.utils.book_new();
    
    const ws = XLSX.utils.aoa_to_sheet(datosPlantilla);
    ws['!cols'] = [
      { wch: 25 },
      { wch: 50 },
    ];

    const wsInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
    wsInstrucciones['!cols'] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 40 },
      { wch: 25 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Categorías');
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones');

    XLSX.writeFile(wb, 'plantilla_categorias.xlsx');
    toast.success('Plantilla Excel descargada correctamente');
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">

      {/* TITULO */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaTags className="text-blue-600" />
          Gestión de Categorías
        </h1>
      </div>

      {/* BUSCADOR Y BOTÓN */}
      <div className="flex gap-4 mb-6 items-center">
        <input
          placeholder="🔍 Buscar categoría..."
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer"
        >
          <FaPlus /> Agregar Categoría
        </button>
        <button
          onClick={openImport}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer"
        >
          <FaFileImport /> Importar CSV
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {loading ? (
          <LoadingSpinner text="Cargando categorías..." />
        ) : categorias.length === 0 ? (
          <EmptyState
            icon={FaTags}
            title="Sin categorías"
            description="No hay categorías registradas"
          />
        ) : (
          <CategoriaTableContent
            categorias={categorias}
            search={search}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            setCurrentPage={setCurrentPage}
            abrirEditar={abrirEditar}
            eliminarCategoria={eliminarCategoria}
            toggleEstado={toggleEstado}
            togglingEstado={togglingEstado}
          />
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 z-50" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
          onClick={handleBackdropClick}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition text-2xl cursor-pointer"
              onClick={handleCloseModal}
              title="Cerrar"
            >
              <FaTimes size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-6 pr-8">
              {editing ? "Editar Categoría" : "Nueva Categoría"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="Nombre de categoría"
                  maxLength={CATEGORY_LIMITS.nombre.max}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Descripción
                </label>
                <textarea
                  placeholder="Descripción"
                  maxLength={CATEGORY_LIMITS.descripcion.max}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={guardarCategoria}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? "Guardando..."
                  : editing
                    ? "Actualizar"
                    : "Guardar"}
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN ELIMINAR */}
      {confirmDelete && (
        <ConfirmDialog
          isOpen={!!confirmDelete}
          title="Eliminar Categoría"
          message="¿Está seguro de que desea eliminar esta categoría? Esta acción no se puede deshacer."
          onConfirm={() => confirmarEliminar(false)}
          onCancel={() => setConfirmDelete(null)}
          isLoading={deleting}
        />
      )}

      {/* Modal de opciones cuando la categoría tiene productos */}
      {showDeleteOptions && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[100]" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
          onClick={() => !deleting && setShowDeleteOptions(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md p-6 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationTriangle className="text-3xl text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-800">Categoría con Productos</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Esta categoría tiene <span className="font-semibold text-red-600">productos asociados</span>. 
              ¿Qué desea hacer?
            </p>

            <div className="space-y-3">
              {/* Opción 1: Desactivar */}
              <button
                onClick={desactivarCategoria}
                disabled={deleting}
                className="w-full flex items-center gap-3 p-4 border-2 border-yellow-300 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                <FaBan className="text-2xl text-yellow-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Desactivar categoría</p>
                  <p className="text-sm text-gray-500">La categoría no estará disponible pero los productos mantienen su categoría</p>
                </div>
              </button>

              {/* Opción 2: Eliminar forzado */}
              <button
                onClick={eliminarForzado}
                disabled={deleting}
                className="w-full flex items-center gap-3 p-4 border-2 border-red-300 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                <FaTrash className="text-2xl text-red-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Eliminar completamente</p>
                  <p className="text-sm text-gray-500">⚠️ Los productos quedarán sin categoría asignada</p>
                </div>
              </button>

              {/* Cancelar */}
              <button
                onClick={() => setShowDeleteOptions(null)}
                disabled={deleting}
                className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>

            {deleting && (
              <div className="mt-4 text-center text-gray-500">
                Procesando...
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN DESCARTAR CAMBIOS */}
      {confirmDiscard && (
        <ConfirmDialog
          isOpen={!!confirmDiscard}
          title="Descartar cambios"
          message="Hay cambios sin guardar. ¿Está seguro de que desea descartar los cambios?"
          onConfirm={handleConfirmDiscard}
          onCancel={() => setConfirmDiscard(false)}
          confirmText="Descartar"
          confirmingText="Descartando..."
          confirmColor="yellow"
        />
      )}

      {/* MODAL DE IMPORTACIÓN */}
      {importModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-50" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
          onClick={handleImportBackdropClick}
        >
          <div 
            className="bg-white rounded-lg sm:rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              onClick={handleCloseImportModal}
              title="Cerrar"
            >
              <FaTimes className="text-base sm:text-lg" />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 lg:mb-8 pr-8">Importación de Categorías (CSV/Excel)</h2>

            {!importPreview && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Seleccionar archivo CSV para previsualizar:
                  </label>
                  <div
                    className="w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition cursor-pointer flex items-center justify-center bg-gray-50 hover:bg-blue-50"
                    onClick={() => document.getElementById("csvCategoriaInput").click()}
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
                    id="csvCategoriaInput"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => uploadPreview(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-700 font-semibold flex items-center gap-2">
                        <FaFileExcel className="text-green-600" />
                        Plantilla Excel con instrucciones
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Incluye ejemplos, guía de campos y formato listo para usar
                      </p>
                    </div>
                    <button
                      onClick={descargarPlantillaExcel}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap"
                    >
                      <FaDownload />
                      Descargar Plantilla Excel
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-semibold mb-2">Columnas del archivo CSV:</p>
                  <p className="text-xs text-gray-600 font-mono break-all bg-white p-3 rounded border border-gray-200">
                    nombre,descripcion
                  </p>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-600">
                      <strong>📌 Obligatorio:</strong> nombre
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>📋 Opcional:</strong> descripcion
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-xs text-gray-700">
                    <strong>💡 Consejo:</strong> Las categorías se actualizarán si el nombre ya existe, o se crearán si es nuevo.
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
                    Se detectaron <span className="font-bold text-blue-600">{importPreview.count}</span> categorías para importar:
                  </p>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0">
                        <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
                          <th className="px-3 py-2 border-r">Nombre</th>
                          <th className="px-3 py-2">Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.preview.map((r, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-3 py-2 border-r text-sm font-medium">{r.nombre || "-"}</td>
                            <td className="px-3 py-2 text-sm">{r.descripcion || "-"}</td>
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {importUploading ? "Importando..." : "Confirmar Importación"}
                  </button>
                  <button
                    onClick={handleCloseImportModal}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================
// COMPONENTE SEPARADO PARA LA TABLA
// ============================
function CategoriaTableContent({
  categorias,
  search,
  currentPage,
  itemsPerPage,
  setCurrentPage,
  abrirEditar,
  eliminarCategoria,
  toggleEstado,
  togglingEstado,
}) {
  // Filtrar categorías
  const categoriasFiltradas = useMemo(() => {
    return categorias.filter(
      (cat) =>
        cat.nombre.toLowerCase().includes(search.toLowerCase()) ||
        cat.descripcion?.toLowerCase().includes(search.toLowerCase())
    );
  }, [categorias, search]);

  // Datos paginados
  const categoriasPaginadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return categoriasFiltradas.slice(start, start + itemsPerPage);
  }, [categoriasFiltradas, currentPage, itemsPerPage]);

  // Definición de columnas para DataTable
  const tableColumns = useMemo(
    () => [
      {
        id: "nombre",
        header: "Nombre",
        accessorKey: "nombre",
        size: 200,
        minSize: 120,
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      },
      {
        id: "descripcion",
        header: "Descripción",
        accessorKey: "descripcion",
        size: 300,
        minSize: 150,
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        id: "estado",
        header: "Estado",
        accessorKey: "estado",
        size: 100,
        minSize: 80,
        cell: ({ row }) => {
          const estado = row.original.estado || 'activo';
          const isToggling = togglingEstado === (row.original.categoria_id || row.original.id);
          return (
            <button
              onClick={() => toggleEstado(row.original.categoria_id || row.original.id)}
              disabled={isToggling}
              className={`px-2 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                estado === 'activo' 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              } ${isToggling ? 'opacity-50' : ''}`}
              title={estado === 'activo' ? 'Clic para desactivar' : 'Clic para activar'}
            >
              {isToggling ? '...' : estado === 'activo' ? 'Activo' : 'Inactivo'}
            </button>
          );
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        size: 150,
        minSize: 130,
        enableResizing: false,
        cell: ({ row }) => {
          const id = row.original.categoria_id || row.original.id;
          const estado = row.original.estado || 'activo';
          const isToggling = togglingEstado === id;
          return (
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => abrirEditar(row.original)}
                className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded transition cursor-pointer"
                title="Editar"
              >
                <FaEdit size={14} />
              </button>
              <button
                onClick={() => toggleEstado(id)}
                disabled={isToggling}
                className={`w-9 h-9 flex items-center justify-center text-white rounded transition cursor-pointer ${
                  estado === 'activo' 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                title={estado === 'activo' ? 'Desactivar' : 'Activar'}
              >
                {estado === 'activo' ? <FaBan size={14} /> : <FaCheck size={14} />}
              </button>
              <button
                onClick={() => eliminarCategoria(id)}
                className="w-9 h-9 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded transition cursor-pointer"
                title="Eliminar permanentemente"
              >
                <FaTrash size={14} />
              </button>
            </div>
          );
        },
      },
    ],
    [abrirEditar, eliminarCategoria, toggleEstado, togglingEstado]
  );

  return (
    <>
      <DataTable
        columns={tableColumns}
        data={categoriasPaginadas}
        loading={false}
        emptyIcon={FaTags}
        emptyTitle="Sin categorías"
        emptyDescription="No hay categorías que coincidan con la búsqueda"
        enableSorting={true}
        getRowId={(row) => row.categoria_id || row.id}
      />
      {categoriasFiltradas.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(categoriasFiltradas.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}
