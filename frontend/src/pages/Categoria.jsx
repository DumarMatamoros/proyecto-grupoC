import { useEffect, useState, useMemo } from "react";
import { FaTags, FaPlus, FaEdit, FaTrash, FaTimes, FaBan, FaCheck, FaExclamationTriangle } from "react-icons/fa";
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
