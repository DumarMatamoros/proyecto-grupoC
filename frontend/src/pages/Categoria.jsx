import { useEffect, useState } from "react";
import { FaTags, FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import api from "../services/api";
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
  const itemsPerPage = 10;

  const cargarCategorias = async () => {
    setLoading(true);
    try {
      const res = await api.get("/categorias");
      setCategorias(res.data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
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
      toast.error(error.response?.data?.message || "Error al guardar categoría");
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
    setModal(true);
  };

  const abrirEditar = (cat) => {
    setEditing(cat.categoria_id || cat.id);
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion || "");
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
    setEditing(null);
    setNombre("");
    setDescripcion("");
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
      toast.error(error.response?.data?.message || "Error al eliminar categoría");
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
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
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
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase text-sm font-semibold">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias
                    .filter((cat) =>
                      cat.nombre.toLowerCase().includes(search.toLowerCase()) ||
                      cat.descripcion?.toLowerCase().includes(search.toLowerCase())
                    )
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((cat) => (
                      <tr
                        key={cat.categoria_id || cat.id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3 font-medium">{cat.nombre}</td>
                        <td className="px-4 py-3">{cat.descripcion}</td>
                        <td className="px-4 py-3 flex gap-2 justify-center">
                          <button
                            onClick={() => abrirEditar(cat)}
                            className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                            title="Editar"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() =>
                              eliminarCategoria(cat.categoria_id || cat.id)
                            }
                            className="w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded transition"
                            title="Eliminar"
                          >
                            <FaTrash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(
                categorias.filter((cat) =>
                  cat.nombre.toLowerCase().includes(search.toLowerCase()) ||
                  cat.descripcion?.toLowerCase().includes(search.toLowerCase())
                ).length / itemsPerPage
              )}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition text-2xl"
              onClick={cerrarModal}
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
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading
                  ? "Guardando..."
                  : editing
                    ? "Actualizar"
                    : "Guardar"}
              </button>
              <button
                onClick={cerrarModal}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg font-semibold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN */}
      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar Categoría"
          message="¿Está seguro de que desea eliminar esta categoría? Esta acción no se puede deshacer."
          onConfirm={confirmarEliminar}
          onCancel={() => setConfirmDelete(null)}
          isLoading={deleting}
        />
      )}
    </div>
  );
}
