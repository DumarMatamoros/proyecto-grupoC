import { useState, useEffect, useMemo } from "react";
import { FaPlus, FaTimes, FaTrash, FaEdit, FaUser, FaSearch, FaIdCard, FaSlidersH, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCheck, FaUsers } from "react-icons/fa";
import api from "../services/api";
import { getErrorMessage } from "../utils/errorTranslator";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import useToast from "../hooks/useToast";

export default function Clientes() {
  const toast = useToast();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modal
  const [modal, setModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [saving, setSaving] = useState(false);

  // Búsqueda
  const [search, setSearch] = useState("");

  // Tipos de identificación
  const ID_TYPES = {
    RUC: "RUC",
    CEDULA: "Cédula",
    PASAPORTE: "Pasaporte",
    CONSUMIDOR_FINAL: "Consumidor Final",
  };

  // Visibilidad de columnas
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    id_type: true,
    id_number: true,
    razon_social: true,
    telefono: true,
    email: true,
    direccion: false,
    is_active: true,
    acciones: true,
  });

  // Formulario
  const [form, setForm] = useState({
    id_type: "CEDULA",
    id_number: "",
    razon_social: "",
    direccion: "",
    telefono: "",
    email: "",
    notes: "",
  });

  // ============================
  // CARGAR DATOS
  // ============================
  const cargarClientes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/clientes");
      // La API devuelve paginación, extraemos los datos
      setClientes(res.data?.data?.data || res.data?.data || []);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // ============================
  // FILTRADO
  // ============================
  const clientesFiltrados = useMemo(() => {
    if (!search.trim()) return clientes;
    const term = search.toLowerCase();
    return clientes.filter((c) =>
      c.razon_social?.toLowerCase().includes(term) ||
      c.id_number?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.telefono?.includes(term)
    );
  }, [clientes, search]);

  // ============================
  // COLUMNAS DE LA TABLA
  // ============================
  const tableColumns = useMemo(() => {
    const cols = [];

    if (visibleCols.id_type) {
      cols.push({
        accessorKey: "id_type",
        header: "Tipo ID",
        size: 120,
        cell: ({ getValue }) => (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {ID_TYPES[getValue()] || getValue()}
          </span>
        ),
      });
    }

    if (visibleCols.id_number) {
      cols.push({
        accessorKey: "id_number",
        header: "Identificación",
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-mono text-gray-800">{getValue()}</span>
        ),
      });
    }

    if (visibleCols.razon_social) {
      cols.push({
        accessorKey: "razon_social",
        header: "Nombre / Razón Social",
        size: 220,
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-800">{getValue()}</span>
        ),
      });
    }

    if (visibleCols.telefono) {
      cols.push({
        accessorKey: "telefono",
        header: "Teléfono",
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-gray-600">{getValue() || "-"}</span>
        ),
      });
    }

    if (visibleCols.email) {
      cols.push({
        accessorKey: "email",
        header: "Email",
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-gray-600">{getValue() || "-"}</span>
        ),
      });
    }

    if (visibleCols.direccion) {
      cols.push({
        accessorKey: "direccion",
        header: "Dirección",
        size: 250,
        cell: ({ getValue }) => (
          <span className="text-gray-600 text-sm">{getValue() || "-"}</span>
        ),
      });
    }

    if (visibleCols.is_active) {
      cols.push({
        accessorKey: "is_active",
        header: "Estado",
        size: 100,
        cell: ({ getValue }) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            getValue() ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {getValue() ? "Activo" : "Inactivo"}
          </span>
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
              onClick={() => abrirEdicion(row.original)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition cursor-pointer"
              title="Editar"
            >
              <FaEdit />
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

  // ============================
  // ABRIR MODAL
  // ============================
  const abrirModal = () => {
    setForm({
      id_type: "CEDULA",
      id_number: "",
      razon_social: "",
      direccion: "",
      telefono: "",
      email: "",
      notes: "",
    });
    setEditingCliente(null);
    setModal(true);
  };

  const abrirEdicion = (cliente) => {
    setForm({
      id_type: cliente.id_type || "CEDULA",
      id_number: cliente.id_number || "",
      razon_social: cliente.razon_social || "",
      direccion: cliente.direccion || "",
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      notes: cliente.notes || "",
    });
    setEditingCliente(cliente);
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
    setEditingCliente(null);
  };

  // ============================
  // GUARDAR CLIENTE
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!form.id_number || !form.razon_social || !form.direccion) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    setSaving(true);
    try {
      if (editingCliente) {
        await api.put(`/clientes/${editingCliente.cliente_id}`, form);
        toast.success("Cliente actualizado exitosamente");
      } else {
        await api.post("/clientes", form);
        toast.success("Cliente creado exitosamente");
      }
      cerrarModal();
      cargarClientes();
    } catch (error) {
      console.error("Error guardando cliente:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // ELIMINAR CLIENTE
  // ============================
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/clientes/${confirmDelete.cliente_id}`);
      toast.success("Cliente eliminado exitosamente");
      setConfirmDelete(null);
      cargarClientes();
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  // ============================
  // RENDER
  // ============================
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ENCABEZADO */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <FaUsers className="text-blue-600" />
            Clientes
          </h1>
          <p className="text-gray-500 mt-1">Gestiona los clientes para facturación</p>
        </div>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition cursor-pointer"
        >
          <FaPlus /> Nuevo Cliente
        </button>
      </div>

      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FaUsers className="text-xl text-blue-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Clientes</p>
            <p className="text-2xl font-bold text-gray-800">{clientes.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <FaCheck className="text-xl text-green-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Activos</p>
            <p className="text-2xl font-bold text-gray-800">
              {clientes.filter(c => c.is_active).length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <FaIdCard className="text-xl text-purple-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Con RUC</p>
            <p className="text-2xl font-bold text-gray-800">
              {clientes.filter(c => c.id_type === "RUC").length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <FaUser className="text-xl text-orange-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Con Cédula</p>
            <p className="text-2xl font-bold text-gray-800">
              {clientes.filter(c => c.id_type === "CEDULA").length}
            </p>
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, identificación, email o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Botón de columnas */}
          <div className="relative">
            <button
              onClick={() => setShowColumnsMenu(!showColumnsMenu)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition cursor-pointer"
            >
              <FaSlidersH /> Columnas
            </button>
            {showColumnsMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
                {Object.entries(visibleCols).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setVisibleCols({ ...visibleCols, [key]: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{key.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLA DE CLIENTES */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12"><LoadingSpinner /></div>
        ) : clientesFiltrados.length === 0 ? (
          <EmptyState
            icon={FaUsers}
            title="No hay clientes"
            description={search ? "No se encontraron clientes con ese criterio" : "Agrega tu primer cliente"}
            actionLabel="Nuevo Cliente"
            onAction={abrirModal}
          />
        ) : (
          <DataTable
            data={clientesFiltrados}
            columns={tableColumns}
            defaultSorting={[{ id: "razon_social", desc: false }]}
          />
        )}
      </div>

      {/* MODAL DE CLIENTE */}
      {modal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">
                {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button
                onClick={cerrarModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tipo de Identificación e ID */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Identificación *
                  </label>
                  <select
                    value={form.id_type}
                    onChange={(e) => setForm({ ...form, id_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.entries(ID_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Identificación *
                  </label>
                  <input
                    type="text"
                    value={form.id_number}
                    onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={form.id_type === "RUC" ? "1234567890001" : "1234567890"}
                    required
                  />
                </div>
              </div>

              {/* Razón Social */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre / Razón Social *
                </label>
                <input
                  type="text"
                  value={form.razon_social}
                  onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre completo o razón social"
                  required
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <textarea
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Dirección completa"
                  rows={2}
                  required
                />
              </div>

              {/* Teléfono y Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0999999999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Observaciones adicionales..."
                  rows={2}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Guardando..." : editingCliente ? "Actualizar" : "Crear Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Eliminar Cliente"
          message={`¿Estás seguro de eliminar a "${confirmDelete?.razon_social}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          isLoading={deleting}
          confirmText="Eliminar"
          cancelText="Cancelar"
          confirmColor="red"
        />
      )}
    </div>
  );
}
