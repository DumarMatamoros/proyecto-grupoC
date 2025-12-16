import { useEffect, useState, useMemo } from "react";
import { FaTags, FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
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

  const confirmarEliminar = async () => {
    try {
      setDeleting(true);
      await api.delete(`/categorias/${confirmDelete}`);
      toast.success("Categoría eliminada correctamente");
      setConfirmDelete(null);
      cargarCategorias();
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
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
          title="Eliminar Categoría"
          message="¿Está seguro de que desea eliminar esta categoría? Esta acción no se puede deshacer."
          onConfirm={confirmarEliminar}
          onCancel={() => setConfirmDelete(null)}
          isLoading={deleting}
        />
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN DESCARTAR CAMBIOS */}
      {confirmDiscard && (
        <ConfirmDialog
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
        size: 400,
        minSize: 150,
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        id: "acciones",
        header: "Acciones",
        size: 120,
        minSize: 100,
        enableResizing: false,
        cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => abrirEditar(row.original)}
              className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded transition cursor-pointer"
              title="Editar"
            >
              <FaEdit size={14} />
            </button>
            <button
              onClick={() =>
                eliminarCategoria(row.original.categoria_id || row.original.id)
              }
              className="w-9 h-9 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded transition cursor-pointer"
              title="Eliminar"
            >
              <FaTrash size={14} />
            </button>
          </div>
        ),
      },
    ],
    [abrirEditar, eliminarCategoria]
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
