import { useEffect, useState } from "react";
import api from "../services/api";

export default function Categoria() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categorias, setCategorias] = useState([]);

  const cargarCategorias = async () => {
    const res = await api.get("/categorias");
    setCategorias(res.data);
  };

  const guardarCategoria = async () => {
    if (!nombre.trim()) return alert("El nombre es obligatorio");

    await api.post("/categorias", { nombre, descripcion });
    setNombre("");
    setDescripcion("");
    cargarCategorias();
  };

  const eliminarCategoria = async (id) => {
    if (confirm("¿Seguro que deseas eliminar esta categoría?")) {
      await api.delete(`/categorias/${id}`);
      cargarCategorias();
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  return (
    <div className="p-10">

      {/* TITULO */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Gestión de Categorías
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORMULARIO */}
        <div className="col-span-1 bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Nueva Categoría
          </h2>

          <label className="block text-sm font-medium text-gray-600">Nombre</label>
          <input
            type="text"
            className="w-full mt-1 mb-4 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Nombre de categoría"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <label className="block text-sm font-medium text-gray-600">Descripción</label>
          <textarea
            className="w-full mt-1 mb-4 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <button
            onClick={guardarCategoria}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Guardar Categoría
          </button>
        </div>
                                    {/* TABLA */}
        <div className="col-span-2 bg-white p-6 rounded-xl shadow-lg border overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 uppercase text-sm">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {categorias.map((cat) => (
                <tr key={cat.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium">{cat.nombre}</td>
                  <td className="px-4 py-3">{cat.descripcion}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg"
                      onClick={() => eliminarCategoria(cat.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {categorias.length === 0 && (
                <tr>
                  <td
                    colSpan="3"
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No hay categorías registradas...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
