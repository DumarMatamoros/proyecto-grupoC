import { useState, useEffect } from "react";
import api from "../services/api";

export default function InventoryPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [search, setSearch] = useState("");

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
    const res = await api.get("/productos");
    setProductos(res.data);
  };

  const cargarCategorias = async () => {
    const res = await api.get("/categorias");
    setCategorias(res.data);
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
      categoria_id: p.categoria_id,
      iva_aplica: p.iva_aplica,
      ice_aplica: p.ice_aplica,
      imagen: null,
    });

    setPreview(p.imagen ? `http://localhost:8000/storage/${p.imagen}` : null);
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

            alert("Producto actualizado correctamente");
          } else {
            await api.post(`/productos`, data, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            alert("Producto creado correctamente");
          }

          setModal(false);
          cargarProductos();

        } catch (error) {
          console.error("Error:", error.response?.data || error);
          alert("Ocurrió un error al guardar");
        }
      };

  // ============================
  // ELIMINAR
  // ============================
  const eliminarProducto = async (id) => {
    if (!confirm("¿Eliminar producto?")) return;

    await api.delete(`/productos/${id}`);
    cargarProductos();
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
    <div className="ml-64 mt-16 p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between mb-5">
        <h1 className="text-3xl font-bold">Productos</h1>

        <button
          onClick={abrirNuevo}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + Agregar Producto
        </button>
      </div>

      {/* BUSCADOR */}
      <input
        placeholder="🔍 Buscar por nombre o código..."
        className="input mb-4 w-80"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLA */}
      <table className="w-full border bg-white rounded-xl overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-3">Imagen</th>
            <th className="p-3">Código</th>
            <th className="p-3">Nombre</th>
            <th className="p-3">Categoría</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Precio</th>
            <th className="p-3">IVA</th>
            <th className="p-3">ICE</th>
            <th className="p-3">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {productosFiltrados.map((p) => (
            <tr key={p.producto_id} className="border-t hover:bg-gray-50">
              <td className="p-3">
                <img
                  src={
                    p.imagen
                      ? `http://localhost:8000/storage/${p.imagen}`
                      : "/no-image.png"
                  }
                  className="w-12 h-12 rounded object-cover"
                />
              </td>

              <td className="p-3">{p.codigo_principal}</td>
              <td className="p-3">{p.nombre}</td>
              <td className="p-3">{p.categoria?.nombre ?? "Sin categoría"}</td>
              <td className="p-3">{p.stock_actual}</td>
              <td className="p-3">${p.precio_unitario}</td>
              <td className="p-3">{p.iva_aplica ? "Sí" : "No"}</td>
              <td className="p-3">{p.ice_aplica ? "Sí" : "No"}</td>

              <td className="p-3 space-x-2">
                <button
                  onClick={() => abrirEditar(p)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Editar
                </button>

                <button
                  onClick={() => eliminarProducto(p.producto_id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xl modal-anim relative"
          >
            <button
              className="absolute top-3 right-4 text-2xl text-gray-600 hover:text-red-600"
              onClick={() => setModal(false)}
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold mb-6">
              {editing ? "Editar Producto" : "Nuevo Producto"}
            </h2>

            {/* PREVIEW */}
            <div
              className={`w-40 h-40 mx-auto mb-6 rounded-xl border-2 flex items-center justify-center cursor-pointer ${
                dragActive
                  ? "bg-blue-50 border-blue-400"
                  : "border-gray-300 border-dashed"
              }`}
              onClick={() => document.getElementById("inputFile").click()}
            >
              {preview ? (
                <img
                  src={preview}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                "Arrastra o haz clic"
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
            <div className="grid grid-cols-2 gap-4">
              <input
                name="codigo_principal"
                placeholder="Código"
                className="input"
                onChange={handleChange}
                value={form.codigo_principal}
              />

              <input
                name="nombre"
                placeholder="Nombre"
                className="input"
                onChange={handleChange}
                value={form.nombre}
              />

              <input
                name="precio_unitario"
                placeholder="Precio"
                type="number"
                className="input"
                onChange={handleChange}
                value={form.precio_unitario}
              />

              <input
                name="stock_actual"
                placeholder="Stock"
                type="number"
                className="input"
                onChange={handleChange}
                value={form.stock_actual}
              />

              <select
                name="categoria_id"
                className="input col-span-2"
                onChange={handleChange}
                value={form.categoria_id}
              >
                <option value="">Seleccione categoría</option>
                {categorias.map((c) => (
                  <option key={c.categoria_id} value={c.categoria_id}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              <textarea
                name="descripcion"
                placeholder="Descripción"
                className="input col-span-2"
                rows="3"
                onChange={handleChange}
                value={form.descripcion}
              />
            </div>

            {/* CHECKBOXES */}
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="iva_aplica"
                  checked={form.iva_aplica === 1}
                  onChange={handleChange}
                />
                Aplica IVA
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="ice_aplica"
                  checked={form.ice_aplica === 1}
                  onChange={handleChange}
                />
                Aplica ICE
              </label>
            </div>

            {/* BOTONES */}
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg mt-4 font-bold"
              onClick={guardarProducto}
            >
              {editing ? "Actualizar Producto" : "Guardar Producto"}
            </button>

            <button
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg mt-2"
              onClick={() => setModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
