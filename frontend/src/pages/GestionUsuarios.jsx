import { useEffect, useState, useMemo } from "react";
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaBan,
  FaKey,
  FaTimes,
  FaCheck,
  FaUserShield,
  FaUserTie,
  FaUserCog,
  FaUser,
  FaSlidersH,
  FaUserLock,
  FaEye,
  FaEyeSlash,
  FaExclamationTriangle,
} from "react-icons/fa";
import api from "../services/api";
import authService from "../services/authService";
import { getErrorMessage } from "../utils/errorTranslator";
import { useDashboardNavigation, DASHBOARD_SECTIONS } from "../hooks/useDashboardNavigation";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import useToast from "../hooks/useToast";

// ============================
// DEFINICIÓN DE ROLES
// ============================
const ROLES_CONFIG = {
  super_admin: {
    label: "Super Admin",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: FaUserShield,
  },
  administrador: {
    label: "Administrador",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: FaUserTie,
  },
  empleado: {
    label: "Empleado",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: FaUserCog,
  },
  proveedor: {
    label: "Proveedor",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: FaUser,
  },
};

// Roles que puede asignar cada tipo de usuario
const ROLES_PERMITIDOS = {
  super_admin: ["administrador", "empleado", "proveedor"],
  administrador: ["empleado", "proveedor"],
};

export default function GestionUsuarios() {
  const toast = useToast();
  const { navigateTo } = useDashboardNavigation();
  const currentUser = authService.getUser();

  // Estado principal
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estado del modal
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    tipo: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [initialForm, setInitialForm] = useState({});

  // Estado de confirmaciones
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Estado para modal de cambio de contraseña
  const [passwordModal, setPasswordModal] = useState(null); // Usuario seleccionado
  const [passwordMode, setPasswordMode] = useState("manual"); // 'manual' | 'force_change'
  const [newPassword, setNewPassword] = useState("");
  const [forceChangeOnLogin, setForceChangeOnLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Estado para menú de columnas visibles
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    nombre: true,
    email: true,
    rol: true,
    estado: true,
  });

  // Estado para roles dinámicos desde la API
  const [rolesFromDB, setRolesFromDB] = useState([]);

  // ============================
  // DETERMINAR NIVEL DEL USUARIO
  // ============================
  const getUserLevel = () => {
    if (!currentUser) return null;
    
    // Verificar si es super admin (nivel 'super' en administrador)
    if (currentUser.tipo === "administrador" && currentUser.administrador?.nivel === "super") {
      return "super_admin";
    }
    return currentUser.tipo;
  };

  const userLevel = getUserLevel();

  // Obtener roles que puede asignar el usuario actual
  const rolesDisponibles = useMemo(() => {
    const baseRoles = ROLES_PERMITIDOS[userLevel] || [];
    
    // Si hay roles de la BD, filtrar solo los permitidos según el nivel del usuario
    if (rolesFromDB.length > 0) {
      // Filtrar roles de BD que el usuario puede asignar
      // (excluir super_admin y roles superiores al nivel del usuario)
      return rolesFromDB
        .filter(role => {
          // Nunca permitir asignar super_admin
          if (role.name === 'super_admin') return false;
          // Si es super_admin, puede asignar cualquier otro rol
          if (userLevel === 'super_admin') return true;
          // Si es admin, solo puede asignar empleado, proveedor y roles custom
          if (userLevel === 'administrador') {
            return role.name !== 'administrador';
          }
          return false;
        })
        .map(role => role.name);
    }
    
    return baseRoles;
  }, [userLevel, rolesFromDB]);

  // ============================
  // CARGAR ROLES DESDE LA API
  // ============================
  const cargarRoles = async () => {
    try {
      const res = await api.get("/admin/roles");
      const data = res.data.data?.roles || res.data.roles || [];
      setRolesFromDB(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando roles:", error);
      // Si falla, usar los roles hardcodeados como fallback
    }
  };

  // ============================
  // CARGAR USUARIOS
  // ============================
  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/usuarios");
      const data = res.data.data?.data || res.data.data || [];
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // ============================
  // VALIDACIÓN DEL FORMULARIO
  // ============================
  const validarFormulario = () => {
    const errors = {};

    if (!formData.nombre.trim()) {
      errors.nombre = "El nombre es obligatorio";
    } else if (formData.nombre.length < 3) {
      errors.nombre = "El nombre debe tener al menos 3 caracteres";
    }

    if (!formData.email.trim()) {
      errors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "El correo no tiene un formato válido";
    }

    if (!formData.tipo) {
      errors.tipo = "Debe seleccionar un rol";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================
  // GUARDAR USUARIO
  // ============================
  const guardarUsuario = async () => {
    if (!validarFormulario()) {
      toast.warning("Por favor corrija los errores del formulario");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/usuarios/${editing}`, formData);
        toast.success("Usuario actualizado correctamente");
      } else {
        const res = await api.post("/admin/usuarios", formData);
        const passwordTemporal = res.data.data?.password_temporal;
        
        toast.success(
          `Usuario creado exitosamente. ${passwordTemporal ? `Contraseña temporal: ${passwordTemporal}` : ""}`
        );
      }
      cerrarModal();
      cargarUsuarios();
    } catch (error) {
      console.error("Error guardando usuario:", error);
      
      // Manejar errores de validación del backend
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const newErrors = {};
        Object.keys(backendErrors).forEach((key) => {
          newErrors[key] = backendErrors[key][0];
        });
        setFormErrors(newErrors);
      }
      
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // DESACTIVAR USUARIO
  // ============================
  const desactivarUsuario = async () => {
    if (!confirmDeactivate) return;

    setActionLoading(true);
    try {
      await api.delete(`/admin/usuarios/${confirmDeactivate.usuario_id}`);
      toast.success("Usuario desactivado correctamente");
      setConfirmDeactivate(null);
      cargarUsuarios();
    } catch (error) {
      console.error("Error desactivando usuario:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  // ============================
  // CAMBIAR/RESTABLECER CONTRASEÑA
  // ============================
  const abrirModalPassword = (usuario) => {
    setPasswordModal(usuario);
    setPasswordMode("manual");
    setNewPassword("");
    setForceChangeOnLogin(true);
    setShowPassword(false);
  };

  const cerrarModalPassword = () => {
    setPasswordModal(null);
    setPasswordMode("manual");
    setNewPassword("");
    setForceChangeOnLogin(true);
    setShowPassword(false);
  };

  const handlePasswordAction = async () => {
    if (!passwordModal) return;

    setActionLoading(true);
    try {
      if (passwordMode === "manual") {
        // Validar contraseña
        if (!newPassword || newPassword.length < 8) {
          toast.error("La contraseña debe tener al menos 8 caracteres");
          setActionLoading(false);
          return;
        }

        await api.post(`/admin/usuarios/${passwordModal.usuario_id}/reset-password`, {
          mode: "manual",
          new_password: newPassword,
          force_change: forceChangeOnLogin,
        });

        toast.success(
          forceChangeOnLogin
            ? "Contraseña establecida. El usuario deberá cambiarla en el próximo inicio de sesión."
            : "Contraseña actualizada exitosamente."
        );
      } else {
        // Solo solicitar cambio en próximo login
        await api.post(`/admin/usuarios/${passwordModal.usuario_id}/reset-password`, {
          mode: "force_change",
        });

        toast.success("El usuario deberá cambiar su contraseña en el próximo inicio de sesión.");
      }

      cerrarModalPassword();
    } catch (error) {
      console.error("Error cambiando contraseña:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  // ============================
  // MANEJO DEL MODAL
  // ============================
  const abrirNuevo = () => {
    setEditing(null);
    setFormData({ nombre: "", email: "", tipo: "" });
    setFormErrors({});
    setInitialForm({ nombre: "", email: "", tipo: "" });
    setModal(true);
    // Cargar roles frescos desde la API
    cargarRoles();
  };

  const abrirEditar = (usuario) => {
    setEditing(usuario.usuario_id);
    const data = {
      nombre: usuario.nombre || "",
      email: usuario.email || "",
      tipo: usuario.tipo || "",
    };
    setFormData(data);
    setFormErrors({});
    setInitialForm(data);
    setModal(true);
    // Cargar roles frescos desde la API
    cargarRoles();
  };

  const cerrarModal = () => {
    setModal(false);
    setEditing(null);
    setFormData({ nombre: "", email: "", tipo: "" });
    setFormErrors({});
  };

  const hasFormChanges = () => {
    return (
      formData.nombre !== initialForm.nombre ||
      formData.email !== initialForm.email ||
      formData.tipo !== initialForm.tipo
    );
  };

  const handleCloseModal = () => {
    if (hasFormChanges()) {
      setConfirmDiscard(true);
    } else {
      cerrarModal();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo cuando se modifica
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ============================
  // FILTRADO Y PAGINACIÓN
  // ============================
  const usuariosFiltrados = useMemo(() => {
    if (!search.trim()) return usuarios;
    
    const searchLower = search.toLowerCase();
    return usuarios.filter(
      (u) =>
        u.nombre?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.tipo?.toLowerCase().includes(searchLower)
    );
  }, [usuarios, search]);

  const totalPages = Math.ceil(usuariosFiltrados.length / itemsPerPage);
  const usuariosPaginados = usuariosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // ============================
  // RENDERIZAR BADGE DE ROL
  // ============================
  const renderRolBadge = (tipo) => {
    const config = ROLES_CONFIG[tipo] || {
      label: tipo || "Sin rol",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: FaUser,
    };
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  // ============================
  // RENDERIZAR BADGE DE ESTADO
  // ============================
  const renderEstadoBadge = (activo = true) => {
    return activo ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <FaCheck size={10} />
        Activo
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        <FaBan size={10} />
        Inactivo
      </span>
    );
  };

  // ============================
  // DEFINICIÓN DE COLUMNAS PARA DATATABLE
  // ============================
  const tableColumns = useMemo(() => {
    const cols = [];

    if (visibleCols.nombre) {
      cols.push({
        accessorKey: "nombre",
        header: "Nombre",
        size: 180,
        minSize: 120,
        maxWidth: 250,
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">{getValue()}</span>
        ),
      });
    }

    if (visibleCols.email) {
      cols.push({
        accessorKey: "email",
        header: "Correo Electrónico",
        size: 220,
        minSize: 150,
        maxWidth: 300,
        cell: ({ getValue }) => (
          <span className="text-gray-600">{getValue()}</span>
        ),
      });
    }

    if (visibleCols.rol) {
      cols.push({
        accessorKey: "tipo",
        header: "Rol",
        size: 140,
        minSize: 120,
        maxWidth: 180,
        truncate: false,
        cell: ({ getValue }) => renderRolBadge(getValue()),
      });
    }

    if (visibleCols.estado) {
      cols.push({
        accessorKey: "activo",
        header: "Estado",
        size: 100,
        minSize: 90,
        maxWidth: 120,
        truncate: false,
        cell: ({ getValue }) => renderEstadoBadge(getValue() !== false),
      });
    }

    // Columna de acciones (siempre visible)
    cols.push({
      accessorKey: "acciones",
      header: "Acciones",
      size: 170,
      minSize: 170,
      maxSize: 170,
      enableSorting: false,
      enableResizing: false,
      truncate: false,
      cell: ({ row }) => (
        <div className="flex gap-1 justify-center">
          <button
            onClick={() => abrirEditar(row.original)}
            className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded transition cursor-pointer"
            title="Editar usuario"
          >
            <FaEdit className="text-sm" />
          </button>
          <button
            onClick={() => navigateTo(DASHBOARD_SECTIONS.PERMISOS_USUARIO, { usuarioId: row.original.usuario_id })}
            className="w-8 h-8 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded transition cursor-pointer"
            title="Gestionar permisos individuales"
          >
            <FaUserLock className="text-sm" />
          </button>
          <button
            onClick={() => abrirModalPassword(row.original)}
            className="w-8 h-8 flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white rounded transition cursor-pointer"
            title="Gestionar contraseña"
          >
            <FaKey className="text-sm" />
          </button>
          {row.original.usuario_id !== currentUser?.usuario_id && (
            <button
              onClick={() => setConfirmDeactivate(row.original)}
              className="w-8 h-8 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded transition cursor-pointer"
              title="Desactivar usuario"
            >
              <FaBan className="text-sm" />
            </button>
          )}
        </div>
      ),
    });

    return cols;
  }, [visibleCols, currentUser]);

  // ============================
  // RENDER PRINCIPAL
  // ============================
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* TITULO */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaUsers className="text-blue-600" />
          Gestión de Usuarios
        </h1>
      </div>

      {/* BUSCADOR Y BOTÓN */}
      <div className="flex gap-4 mb-6 items-center">
        <input
          placeholder="🔍 Buscar usuario por nombre, correo o rol..."
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer"
        >
          <FaPlus /> Nuevo Usuario
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-lg p-5">
        {loading ? (
          <LoadingSpinner text="Cargando usuarios..." />
        ) : usuarios.length === 0 ? (
          <EmptyState
            icon={FaUsers}
            title="Sin usuarios"
            description="No hay usuarios registrados"
          />
        ) : (
          <>
            {/* MENÚ DE COLUMNAS */}
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
                        checked={visibleCols.nombre}
                        onChange={(e) => setVisibleCols({ ...visibleCols, nombre: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Nombre
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.email}
                        onChange={(e) => setVisibleCols({ ...visibleCols, email: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Correo Electrónico
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.rol}
                        onChange={(e) => setVisibleCols({ ...visibleCols, rol: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Rol
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.estado}
                        onChange={(e) => setVisibleCols({ ...visibleCols, estado: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Estado
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* DATATABLE */}
            <DataTable
              columns={tableColumns}
              data={usuariosPaginados}
              loading={false}
              emptyIcon={FaUsers}
              emptyTitle="Sin usuarios"
              emptyDescription="No se encontraron usuarios con ese criterio"
              enableSorting={true}
              getRowId={(row) => row.usuario_id}
            />
          </>
        )}

        {/* PAGINACIÓN */}
        {usuariosFiltrados.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* MODAL CREAR/EDITAR */}
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

            <h2 className="text-2xl font-bold mb-6 pr-8 flex items-center gap-2">
              <FaUsers className="text-blue-600" />
              {editing ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ingrese el nombre completo"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                    formErrors.nombre ? "border-red-500" : "border-gray-300"
                  }`}
                  value={formData.nombre}
                  onChange={handleInputChange}
                  maxLength={100}
                />
                {formErrors.nombre && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="correo@ejemplo.com"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                    formErrors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  value={formData.email}
                  onChange={handleInputChange}
                  maxLength={100}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer ${
                    formErrors.tipo ? "border-red-500" : "border-gray-300"
                  }`}
                  value={formData.tipo}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccione un rol</option>
                  {rolesDisponibles.map((rol) => {
                    // Buscar label en ROLES_CONFIG o en rolesFromDB
                    const roleFromDB = rolesFromDB.find(r => r.name === rol);
                    const label = ROLES_CONFIG[rol]?.label || roleFromDB?.label || rol.charAt(0).toUpperCase() + rol.slice(1).replace('_', ' ');
                    return (
                      <option key={rol} value={rol}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                {formErrors.tipo && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.tipo}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {userLevel === "super_admin"
                    ? "Como Super Admin, puede asignar cualquier rol."
                    : "Solo puede asignar roles inferiores a su nivel."}
                </p>
              </div>

              {/* Info sobre contraseña */}
              {!editing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    <FaKey className="inline mr-1" />
                    Se generará una contraseña temporal que el usuario deberá
                    cambiar en su primer inicio de sesión.
                  </p>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={guardarUsuario}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Guardando...
                  </>
                ) : editing ? (
                  "Actualizar"
                ) : (
                  "Crear Usuario"
                )}
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2.5 rounded-lg font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO DESACTIVAR USUARIO */}
      {confirmDeactivate && (
        <ConfirmDialog
          title="Desactivar Usuario"
          message={`¿Está seguro de que desea desactivar al usuario "${confirmDeactivate.nombre}"? El usuario no podrá iniciar sesión.`}
          onConfirm={desactivarUsuario}
          onCancel={() => setConfirmDeactivate(null)}
          isLoading={actionLoading}
          confirmText="Desactivar"
          confirmingText="Desactivando..."
          confirmColor="red"
        />
      )}

      {/* MODAL GESTIONAR CONTRASEÑA */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <FaKey className="text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Gestionar Contraseña</h3>
                <p className="text-sm text-gray-500">{passwordModal.nombre}</p>
              </div>
            </div>

            {/* Selector de modo */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPasswordMode('manual')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition text-sm ${
                  passwordMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Establecer contraseña
              </button>
              <button
                onClick={() => setPasswordMode('force_change')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition text-sm ${
                  passwordMode === 'force_change'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Solicitar cambio
              </button>
            </div>

            {/* Contenido según el modo */}
            {passwordMode === 'manual' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                      placeholder="Ingrese la nueva contraseña"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceChangeOnLogin}
                    onChange={(e) => setForceChangeOnLogin(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Forzar cambio en próximo inicio de sesión
                  </span>
                </label>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <FaExclamationTriangle className="text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-orange-800 font-medium">
                      Solicitar cambio de contraseña
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      El usuario deberá cambiar su contraseña la próxima vez que inicie sesión.
                      Su contraseña actual permanecerá válida hasta entonces.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePasswordAction}
                disabled={actionLoading || (passwordMode === 'manual' && newPassword.length < 8)}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                  passwordMode === 'manual'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300'
                    : 'bg-orange-600 hover:bg-orange-700 text-white disabled:bg-orange-300'
                } disabled:cursor-not-allowed`}
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Procesando...
                  </>
                ) : passwordMode === 'manual' ? (
                  'Establecer contraseña'
                ) : (
                  'Solicitar cambio'
                )}
              </button>
              <button
                onClick={cerrarModalPassword}
                disabled={actionLoading}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO DESCARTAR CAMBIOS */}
      {confirmDiscard && (
        <ConfirmDialog
          title="Descartar cambios"
          message="Hay cambios sin guardar. ¿Está seguro de que desea descartar los cambios?"
          onConfirm={() => {
            setConfirmDiscard(false);
            cerrarModal();
          }}
          onCancel={() => setConfirmDiscard(false)}
          confirmText="Descartar"
          confirmingText="Descartando..."
          confirmColor="yellow"
        />
      )}
    </div>
  );
}
