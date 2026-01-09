import { useState, useEffect, useMemo } from "react";
import { FaPlus, FaTimes, FaTrash, FaEdit, FaBuilding, FaSearch, FaIdCard, FaSlidersH, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCheck, FaTruck, FaGlobe, FaUserTie, FaUniversity } from "react-icons/fa";
import api from "../services/api";
import { getErrorMessage } from "../utils/errorTranslator";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import useToast from "../hooks/useToast";

export default function Proveedores() {
  const toast = useToast();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modal
  const [modal, setModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [saving, setSaving] = useState(false);

  // Búsqueda
  const [search, setSearch] = useState("");

  // Tipos de identificación
  const ID_TYPES = {
    RUC: "RUC",
    CEDULA: "Cédula",
    PASAPORTE: "Pasaporte",
  };

  // Tipos de proveedor
  const TIPOS_PROVEEDOR = {
    BIENES: "Bienes/Mercadería",
    SERVICIOS: "Servicios",
    MIXTO: "Bienes y Servicios",
  };

  // Tipos de cuenta
  const TIPOS_CUENTA = {
    AHORROS: "Cuenta de Ahorros",
    CORRIENTE: "Cuenta Corriente",
  };

  // Visibilidad de columnas
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    id_number: true,
    razon_social: true,
    nombre_comercial: false,
    tipo_proveedor: true,
    telefono: true,
    email: true,
    contacto_nombre: false,
    is_active: true,
    acciones: true,
  });

  // Formulario
  const [form, setForm] = useState({
    id_type: "RUC",
    id_number: "",
    razon_social: "",
    nombre_comercial: "",
    direccion: "",
    telefono: "",
    sitio_web: "",
    email: "",
    contacto_nombre: "",
    contacto_telefono: "",
    contacto_email: "",
    tipo_proveedor: "BIENES",
    banco: "",
    cuenta_bancaria: "",
    tipo_cuenta: "",
    notes: "",
  });

  // Tab activo en el modal
  const [activeTab, setActiveTab] = useState("general");

  // ============================
  // CARGAR DATOS
  // ============================
  const cargarProveedores = async () => {
    setLoading(true);
    try {
      const res = await api.get("/proveedores");
      setProveedores(res.data?.data?.data || res.data?.data || []);
    } catch (error) {
      console.error("Error cargando proveedores:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  // ============================
  // FILTRADO
  // ============================
  const proveedoresFiltrados = useMemo(() => {
    if (!search.trim()) return proveedores;
    const term = search.toLowerCase();
    return proveedores.filter((p) =>
      p.razon_social?.toLowerCase().includes(term) ||
      p.nombre_comercial?.toLowerCase().includes(term) ||
      p.id_number?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.telefono?.includes(term)
    );
  }, [proveedores, search]);

  // ============================
  // COLUMNAS DE LA TABLA
  // ============================
  const tableColumns = useMemo(() => {
    const cols = [];

    if (visibleCols.id_number) {
      cols.push({
        accessorKey: "id_number",
        header: "RUC/ID",
        size: 150,
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-gray-800">{row.original.id_number}</span>
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {ID_TYPES[row.original.id_type] || row.original.id_type}
            </span>
          </div>
        ),
      });
    }

    if (visibleCols.razon_social) {
      cols.push({
        accessorKey: "razon_social",
        header: "Razón Social",
        size: 220,
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-800">{getValue()}</span>
        ),
      });
    }

    if (visibleCols.nombre_comercial) {
      cols.push({
        accessorKey: "nombre_comercial",
        header: "Nombre Comercial",
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-gray-600">{getValue() || "-"}</span>
        ),
      });
    }

    if (visibleCols.tipo_proveedor) {
      cols.push({
        accessorKey: "tipo_proveedor",
        header: "Tipo",
        size: 130,
        cell: ({ getValue }) => {
          const tipo = getValue();
          const colors = {
            BIENES: "bg-blue-100 text-blue-700",
            SERVICIOS: "bg-purple-100 text-purple-700",
            MIXTO: "bg-green-100 text-green-700",
          };
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tipo] || "bg-gray-100 text-gray-700"}`}>
              {TIPOS_PROVEEDOR[tipo] || tipo || "Sin definir"}
            </span>
          );
        },
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

    if (visibleCols.contacto_nombre) {
      cols.push({
        accessorKey: "contacto_nombre",
        header: "Contacto",
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-gray-600">{getValue() || "-"}</span>
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
      id_type: "RUC",
      id_number: "",
      razon_social: "",
      nombre_comercial: "",
      direccion: "",
      telefono: "",
      sitio_web: "",
      email: "",
      contacto_nombre: "",
      contacto_telefono: "",
      contacto_email: "",
      tipo_proveedor: "BIENES",
      banco: "",
      cuenta_bancaria: "",
      tipo_cuenta: "",
      notes: "",
    });
    setEditingProveedor(null);
    setActiveTab("general");
    setModal(true);
  };

  const abrirEdicion = (proveedor) => {
    setForm({
      id_type: proveedor.id_type || "RUC",
      id_number: proveedor.id_number || "",
      razon_social: proveedor.razon_social || "",
      nombre_comercial: proveedor.nombre_comercial || "",
      direccion: proveedor.direccion || "",
      telefono: proveedor.telefono || "",
      sitio_web: proveedor.sitio_web || "",
      email: proveedor.email || "",
      contacto_nombre: proveedor.contacto_nombre || "",
      contacto_telefono: proveedor.contacto_telefono || "",
      contacto_email: proveedor.contacto_email || "",
      tipo_proveedor: proveedor.tipo_proveedor || "BIENES",
      banco: proveedor.banco || "",
      cuenta_bancaria: proveedor.cuenta_bancaria || "",
      tipo_cuenta: proveedor.tipo_cuenta || "",
      notes: proveedor.notes || "",
    });
    setEditingProveedor(proveedor);
    setActiveTab("general");
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
    setEditingProveedor(null);
  };

  // ============================
  // GUARDAR PROVEEDOR
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.id_number || !form.razon_social || !form.direccion) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    setSaving(true);
    try {
      if (editingProveedor) {
        await api.put(`/proveedores/${editingProveedor.proveedor_id}`, form);
        toast.success("Proveedor actualizado exitosamente");
      } else {
        await api.post("/proveedores", form);
        toast.success("Proveedor creado exitosamente");
      }
      cerrarModal();
      cargarProveedores();
    } catch (error) {
      console.error("Error guardando proveedor:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // ELIMINAR PROVEEDOR
  // ============================
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/proveedores/${confirmDelete.proveedor_id}`);
      toast.success("Proveedor eliminado exitosamente");
      setConfirmDelete(null);
      cargarProveedores();
    } catch (error) {
      console.error("Error eliminando proveedor:", error);
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
            <FaTruck className="text-green-600" />
            Proveedores
          </h1>
          <p className="text-gray-500 mt-1">Gestiona los proveedores de mercadería y servicios</p>
        </div>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition cursor-pointer"
        >
          <FaPlus /> Nuevo Proveedor
        </button>
      </div>

      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <FaTruck className="text-xl text-green-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Proveedores</p>
            <p className="text-2xl font-bold text-gray-800">{proveedores.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FaBuilding className="text-xl text-blue-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Bienes</p>
            <p className="text-2xl font-bold text-gray-800">
              {proveedores.filter(p => p.tipo_proveedor === "BIENES").length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <FaUserTie className="text-xl text-purple-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Servicios</p>
            <p className="text-2xl font-bold text-gray-800">
              {proveedores.filter(p => p.tipo_proveedor === "SERVICIOS").length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <FaCheck className="text-xl text-orange-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Activos</p>
            <p className="text-2xl font-bold text-gray-800">
              {proveedores.filter(p => p.is_active).length}
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
              placeholder="Buscar por nombre, RUC, email o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLA DE PROVEEDORES */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12"><LoadingSpinner /></div>
        ) : proveedoresFiltrados.length === 0 ? (
          <EmptyState
            icon={FaTruck}
            title="No hay proveedores"
            description={search ? "No se encontraron proveedores con ese criterio" : "Agrega tu primer proveedor"}
            actionLabel="Nuevo Proveedor"
            onAction={abrirModal}
          />
        ) : (
          <DataTable
            data={proveedoresFiltrados}
            columns={tableColumns}
            defaultSorting={[{ id: "razon_social", desc: false }]}
          />
        )}
      </div>

      {/* MODAL DE PROVEEDOR */}
      {modal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">
                {editingProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
              </h2>
              <button
                onClick={cerrarModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b bg-gray-50">
              <div className="flex gap-1 px-6">
                {[
                  { id: "general", label: "General", icon: FaBuilding },
                  { id: "contacto", label: "Contacto", icon: FaUserTie },
                  { id: "bancario", label: "Datos Bancarios", icon: FaUniversity },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition cursor-pointer ${
                      activeTab === tab.id
                        ? "text-green-600 border-b-2 border-green-600 bg-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <tab.icon /> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* TAB GENERAL */}
              {activeTab === "general" && (
                <div className="space-y-4">
                  {/* Tipo de Identificación e ID */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Identificación *
                      </label>
                      <select
                        value={form.id_type}
                        onChange={(e) => setForm({ ...form, id_type: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
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
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="1234567890001"
                        required
                      />
                    </div>
                  </div>

                  {/* Razón Social y Nombre Comercial */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Razón Social *
                      </label>
                      <input
                        type="text"
                        value={form.razon_social}
                        onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Nombre legal de la empresa"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Comercial
                      </label>
                      <input
                        type="text"
                        value={form.nombre_comercial}
                        onChange={(e) => setForm({ ...form, nombre_comercial: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Nombre comercial (opcional)"
                      />
                    </div>
                  </div>

                  {/* Tipo de Proveedor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Proveedor
                    </label>
                    <select
                      value={form.tipo_proveedor}
                      onChange={(e) => setForm({ ...form, tipo_proveedor: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {Object.entries(TIPOS_PROVEEDOR).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <textarea
                      value={form.direccion}
                      onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Dirección completa"
                      rows={2}
                      required
                    />
                  </div>

                  {/* Teléfono, Email, Web */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={form.telefono}
                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="04-1234567"
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
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="correo@empresa.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sitio Web
                      </label>
                      <input
                        type="url"
                        value={form.sitio_web}
                        onChange={(e) => setForm({ ...form, sitio_web: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="https://www.empresa.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTACTO */}
              {activeTab === "contacto" && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Persona de contacto:</strong> Información del representante o contacto principal del proveedor.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Contacto
                    </label>
                    <input
                      type="text"
                      value={form.contacto_nombre}
                      onChange={(e) => setForm({ ...form, contacto_nombre: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Nombre completo del contacto"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono del Contacto
                      </label>
                      <input
                        type="text"
                        value={form.contacto_telefono}
                        onChange={(e) => setForm({ ...form, contacto_telefono: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="0999999999"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email del Contacto
                      </label>
                      <input
                        type="email"
                        value={form.contacto_email}
                        onChange={(e) => setForm({ ...form, contacto_email: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="contacto@empresa.com"
                      />
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas / Observaciones
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Información adicional sobre el proveedor..."
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* TAB BANCARIO */}
              {activeTab === "bancario" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Información bancaria:</strong> Datos para realizar pagos y transferencias al proveedor.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banco
                    </label>
                    <input
                      type="text"
                      value={form.banco}
                      onChange={(e) => setForm({ ...form, banco: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Nombre del banco"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Cuenta
                      </label>
                      <select
                        value={form.tipo_cuenta}
                        onChange={(e) => setForm({ ...form, tipo_cuenta: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Seleccionar...</option>
                        {Object.entries(TIPOS_CUENTA).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Cuenta
                      </label>
                      <input
                        type="text"
                        value={form.cuenta_bancaria}
                        onChange={(e) => setForm({ ...form, cuenta_bancaria: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
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
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Guardando..." : editingProveedor ? "Actualizar" : "Crear Proveedor"}
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
          title="Eliminar Proveedor"
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
