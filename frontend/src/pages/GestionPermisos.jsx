import { useEffect, useState, useMemo, useCallback } from "react";
import {
  FaUserShield,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
  FaUndo,
  FaCheck,
  FaLock,
  FaCheckSquare,
  FaSquare,
  FaMinusSquare,
} from "react-icons/fa";
import api from "../services/api";
import authService from "../services/authService";
import { getErrorMessage } from "../utils/errorTranslator";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import useToast from "../hooks/useToast";

// ============================
// TRADUCCIÓN DE MÓDULOS Y ACCIONES
// ============================
const MODULES_LABELS = {
  inventario: "Inventario",
  categorias: "Categorías",
  compras: "Compras",
  egresos: "Egresos",
  facturacion: "Facturación",
  usuarios: "Usuarios",
  roles: "Roles y Permisos",
  reportes: "Reportes",
  configuracion: "Configuración",
};

const ACTIONS_LABELS = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
  gestionar: "Gestionar",
};

// Colores para los roles (armonizados con el sistema)
const ROLE_COLORS = {
  super_admin: "bg-purple-600 text-white",
  administrador: "bg-blue-600 text-white",
  empleado: "bg-green-600 text-white",
  proveedor: "bg-orange-600 text-white",
};

export default function GestionPermisos() {
  const toast = useToast();
  const currentUser = authService.getUser();

  // ============================
  // ESTADOS
  // ============================
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [originalRolePermissions, setOriginalRolePermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Modal para crear rol
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);

  // Confirmaciones
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // ============================
  // VERIFICACIONES DE USUARIO
  // ============================
  const isSuperAdmin = useMemo(() => {
    return (
      currentUser?.tipo === "administrador" &&
      currentUser?.administrador?.nivel === "super"
    );
  }, [currentUser]);

  // Verificar si puede editar el rol seleccionado
  const canEditSelectedRole = useMemo(() => {
    if (!selectedRole) return false;
    // No se puede editar super_admin
    if (selectedRole.name === "super_admin") return false;
    // Solo super_admin puede editar cualquier rol
    if (isSuperAdmin) return true;
    // Admins normales solo pueden editar empleado y proveedor
    return ["empleado", "proveedor"].includes(selectedRole.name);
  }, [selectedRole, isSuperAdmin]);

  // ============================
  // SELECCIONAR ROL (función helper sin dependencias de estado)
  // ============================
  const selectRoleFromData = (role, rolesData) => {
    setSelectedRole(role);
    const roleData = rolesData.find((r) => r.id === role.id);
    // permissions ya viene como array de strings desde la API
    const perms = Array.isArray(roleData?.permissions) 
      ? roleData.permissions.map((p) => typeof p === 'string' ? p : p.name)
      : [];
    setRolePermissions([...perms]);
    setOriginalRolePermissions([...perms]);
    setHasChanges(false);
  };

  // ============================
  // CARGAR DATOS INICIALES
  // ============================
  const cargarMatrix = useCallback(async (showError = true) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/roles/matrix");
      const data = res.data.data || res.data;
      
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
      
      return data;
    } catch (error) {
      console.error("Error cargando matriz:", error);
      if (showError) {
        toast.error(getErrorMessage(error));
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Cargar datos al montar el componente
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      const data = await cargarMatrix(true);
      
      // Seleccionar primer rol editable por defecto
      if (isMounted && data?.roles?.length > 0) {
        const firstEditable = data.roles.find((r) => r.name !== "super_admin");
        if (firstEditable) {
          selectRoleFromData(firstEditable, data.roles);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar

  // ============================
  // ORGANIZAR PERMISOS POR MÓDULO
  // ============================
  const permissionsByModule = useMemo(() => {
    const grouped = {};
    permissions.forEach((perm) => {
      const [module, action] = perm.name.split(".");
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push({ ...perm, action });
    });
    return grouped;
  }, [permissions]);

  // Obtener todas las acciones únicas
  const allActions = useMemo(() => {
    const actions = new Set();
    permissions.forEach((perm) => {
      const [, action] = perm.name.split(".");
      actions.add(action);
    });
    // Ordenar: ver, crear, editar, eliminar, gestionar
    const order = ["ver", "crear", "editar", "eliminar", "gestionar"];
    return [...actions].sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [permissions]);

  // ============================
  // SELECCIONAR ROL
  // ============================
  const handleSelectRole = (role, rolesData = roles) => {
    if (hasChanges) {
      setConfirmDiscard({ nextRole: role });
      return;
    }
    selectRoleFromData(role, rolesData);
  };

  // ============================
  // MANEJAR CAMBIOS DE PERMISOS
  // ============================
  const togglePermission = (permissionName) => {
    if (!canEditSelectedRole) return;

    setRolePermissions((prev) => {
      const newPerms = prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName];
      setHasChanges(
        JSON.stringify(newPerms.sort()) !==
          JSON.stringify(originalRolePermissions.sort())
      );
      return newPerms;
    });
  };

  // Marcar/desmarcar toda una fila (módulo)
  const toggleModule = (module) => {
    if (!canEditSelectedRole) return;

    const modulePerms = permissionsByModule[module]?.map((p) => p.name) || [];
    const allChecked = modulePerms.every((p) => rolePermissions.includes(p));

    setRolePermissions((prev) => {
      let newPerms;
      if (allChecked) {
        // Desmarcar todos
        newPerms = prev.filter((p) => !modulePerms.includes(p));
      } else {
        // Marcar todos
        newPerms = [...new Set([...prev, ...modulePerms])];
      }
      setHasChanges(
        JSON.stringify(newPerms.sort()) !==
          JSON.stringify(originalRolePermissions.sort())
      );
      return newPerms;
    });
  };

  // Marcar/desmarcar toda una columna (acción)
  const toggleAction = (action) => {
    if (!canEditSelectedRole) return;

    const actionPerms = permissions
      .filter((p) => p.name.endsWith(`.${action}`))
      .map((p) => p.name);
    const allChecked = actionPerms.every((p) => rolePermissions.includes(p));

    setRolePermissions((prev) => {
      let newPerms;
      if (allChecked) {
        newPerms = prev.filter((p) => !actionPerms.includes(p));
      } else {
        newPerms = [...new Set([...prev, ...actionPerms])];
      }
      setHasChanges(
        JSON.stringify(newPerms.sort()) !==
          JSON.stringify(originalRolePermissions.sort())
      );
      return newPerms;
    });
  };

  // Obtener estado del checkbox del módulo (todos, algunos, ninguno)
  const getModuleCheckState = (module) => {
    const modulePerms = permissionsByModule[module]?.map((p) => p.name) || [];
    const checkedCount = modulePerms.filter((p) =>
      rolePermissions.includes(p)
    ).length;
    if (checkedCount === 0) return "none";
    if (checkedCount === modulePerms.length) return "all";
    return "partial";
  };

  // Obtener estado del checkbox de la acción
  const getActionCheckState = (action) => {
    const actionPerms = permissions
      .filter((p) => p.name.endsWith(`.${action}`))
      .map((p) => p.name);
    const checkedCount = actionPerms.filter((p) =>
      rolePermissions.includes(p)
    ).length;
    if (checkedCount === 0) return "none";
    if (checkedCount === actionPerms.length) return "all";
    return "partial";
  };

  // ============================
  // GUARDAR CAMBIOS
  // ============================
  const handleSave = async () => {
    if (!selectedRole || !hasChanges) return;

    setSaving(true);
    try {
      await api.put(`/admin/roles/${selectedRole.id}/permissions`, {
        permissions: rolePermissions,
      });
      toast.success("Permisos actualizados correctamente");
      setOriginalRolePermissions([...rolePermissions]);
      setHasChanges(false);
      // Recargar para obtener datos actualizados
      await cargarMatrix();
    } catch (error) {
      console.error("Error guardando permisos:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Descartar cambios
  const handleDiscard = () => {
    setRolePermissions([...originalRolePermissions]);
    setHasChanges(false);
  };

  // ============================
  // CREAR ROL
  // ============================
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("El nombre del rol es requerido");
      return;
    }

    setCreatingRole(true);
    try {
      await api.post("/admin/roles", { name: newRoleName.trim().toLowerCase() });
      toast.success("Rol creado correctamente");
      setShowCreateModal(false);
      setNewRoleName("");
      await cargarMatrix();
    } catch (error) {
      console.error("Error creando rol:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setCreatingRole(false);
    }
  };

  // ============================
  // ELIMINAR ROL
  // ============================
  const handleDeleteRole = async () => {
    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/roles/${confirmDelete.id}`);
      toast.success("Rol eliminado correctamente");
      setConfirmDelete(null);
      if (selectedRole?.id === confirmDelete.id) {
        setSelectedRole(null);
        setRolePermissions([]);
      }
      await cargarMatrix();
    } catch (error) {
      console.error("Error eliminando rol:", error);
      toast.error(getErrorMessage(error));
    }
  };

  // ============================
  // RENDER
  // ============================
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner text="Cargando permisos..." />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaUserShield className="text-blue-600" />
          Gestión de Permisos
        </h1>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
          >
            <FaPlus /> Crear Rol
          </button>
        )}
      </div>

      {/* Selector de Roles */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">
          Seleccionar Rol
        </h2>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition cursor-pointer ${
                selectedRole?.id === role.id
                  ? `${ROLE_COLORS[role.name] || "bg-gray-600 text-white"} border-transparent`
                  : "bg-white border-gray-200 hover:border-gray-400 text-gray-700"
              } ${role.name === "super_admin" ? "opacity-60" : ""}`}
            >
              {role.name === "super_admin" && <FaLock className="text-xs" />}
              <span className="capitalize">{role.name.replace("_", " ")}</span>
              <span className="text-xs opacity-70">
                ({role.permissions_count || role.permissions?.length || 0})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Matriz de Permisos */}
      {selectedRole && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header de la matriz */}
          <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                Permisos del rol:{" "}
                <span
                  className={`px-3 py-1 rounded-lg capitalize ${
                    ROLE_COLORS[selectedRole.name] || "bg-gray-600 text-white"
                  }`}
                >
                  {selectedRole.name.replace("_", " ")}
                </span>
              </h2>
              {selectedRole.name === "super_admin" && (
                <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                  <FaLock /> Este rol tiene todos los permisos y no puede ser
                  modificado
                </p>
              )}
              {!canEditSelectedRole && selectedRole.name !== "super_admin" && (
                <p className="text-sm text-gray-500 mt-1">
                  No tienes permisos para editar este rol
                </p>
              )}
            </div>

            {canEditSelectedRole && (
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <>
                    <button
                      onClick={handleDiscard}
                      className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                    >
                      <FaUndo /> Descartar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 cursor-pointer"
                    >
                      {saving ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <FaSave />
                      )}
                      Guardar
                    </button>
                  </>
                )}

                {isSuperAdmin &&
                  !["super_admin", "administrador", "empleado", "proveedor"].includes(
                    selectedRole.name
                  ) && (
                    <button
                      onClick={() => setConfirmDelete(selectedRole)}
                      className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition cursor-pointer"
                    >
                      <FaTrash /> Eliminar rol
                    </button>
                  )}
              </div>
            )}
          </div>

          {/* Tabla de permisos */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-600 border-b min-w-[180px]">
                    Módulo
                  </th>
                  {allActions.map((action) => {
                    // Colores por tipo de acción
                    const actionColors = {
                      ver: "text-blue-600",
                      crear: "text-green-600",
                      editar: "text-yellow-500",
                      eliminar: "text-red-600",
                      gestionar: "text-purple-600",
                      exportar: "text-teal-600",
                    };
                    const colorClass = actionColors[action] || "text-gray-600";
                    
                    return (
                    <th
                      key={action}
                      className="p-2 font-semibold text-gray-600 border-b text-center min-w-[80px]"
                    >
                      <button
                        onClick={() => toggleAction(action)}
                        disabled={!canEditSelectedRole}
                        className={`flex flex-col items-center gap-0.5 mx-auto ${
                          canEditSelectedRole
                            ? "hover:opacity-70 cursor-pointer"
                            : "cursor-not-allowed"
                        }`}
                        title={
                          canEditSelectedRole
                            ? `Marcar/desmarcar todos: ${ACTIONS_LABELS[action] || action}`
                            : ""
                        }
                      >
                        <span className="text-xs uppercase tracking-wide">{ACTIONS_LABELS[action] || action}</span>
                        {canEditSelectedRole && (
                          <span>
                            {getActionCheckState(action) === "all" && (
                              <FaCheckSquare className={colorClass} />
                            )}
                            {getActionCheckState(action) === "partial" && (
                              <FaMinusSquare className={colorClass} />
                            )}
                            {getActionCheckState(action) === "none" && (
                              <FaSquare className="text-gray-300" />
                            )}
                          </span>
                        )}
                      </button>
                    </th>
                  );})}
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissionsByModule).map(
                  ([module, modulePerms]) => (
                    <tr
                      key={module}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      {/* Nombre del módulo con checkbox de fila */}
                      <td className="p-3">
                        <button
                          onClick={() => toggleModule(module)}
                          disabled={!canEditSelectedRole}
                          className={`flex items-center gap-2 font-medium text-gray-700 ${
                            canEditSelectedRole
                              ? "hover:text-blue-600 cursor-pointer"
                              : "cursor-not-allowed"
                          }`}
                        >
                          {canEditSelectedRole && (
                            <span>
                              {getModuleCheckState(module) === "all" && (
                                <FaCheckSquare className="text-blue-600" />
                              )}
                              {getModuleCheckState(module) === "partial" && (
                                <FaMinusSquare className="text-blue-400" />
                              )}
                              {getModuleCheckState(module) === "none" && (
                                <FaSquare className="text-gray-300" />
                              )}
                            </span>
                          )}
                          {MODULES_LABELS[module] || module}
                        </button>
                      </td>

                      {/* Checkboxes de permisos */}
                      {allActions.map((action) => {
                        const permName = `${module}.${action}`;
                        const hasPermission =
                          modulePerms.find((p) => p.action === action) !== undefined;
                        const isChecked = rolePermissions.includes(permName);
                        
                        // Colores por tipo de acción
                        const actionColors = {
                          ver: "text-blue-600",
                          crear: "text-green-600",
                          editar: "text-yellow-500",
                          eliminar: "text-red-600",
                          gestionar: "text-purple-600",
                          exportar: "text-teal-600",
                        };
                        const colorClass = actionColors[action] || "text-gray-600";

                        return (
                          <td key={action} className="p-2 text-center">
                            {hasPermission ? (
                              <button
                                onClick={() => togglePermission(permName)}
                                disabled={!canEditSelectedRole}
                                className={`${
                                  canEditSelectedRole
                                    ? "cursor-pointer hover:opacity-70"
                                    : "cursor-not-allowed"
                                }`}
                              >
                                {isChecked ? (
                                  <FaCheckSquare className={colorClass} />
                                ) : (
                                  <FaSquare className="text-gray-300" />
                                )}
                              </button>
                            ) : (
                              <span className="text-gray-300 text-sm">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div className="p-3 bg-gray-50 border-t">
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <FaCheckSquare className="text-blue-600" />
                Ver
              </span>
              <span className="flex items-center gap-1.5">
                <FaCheckSquare className="text-green-600" />
                Crear
              </span>
              <span className="flex items-center gap-1.5">
                <FaCheckSquare className="text-yellow-500" />
                Editar
              </span>
              <span className="flex items-center gap-1.5">
                <FaCheckSquare className="text-red-600" />
                Eliminar
              </span>
              <span className="flex items-center gap-1.5">
                <FaSquare className="text-gray-300" />
                Inactivo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-gray-400">—</span>
                No aplica
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Rol */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Crear Nuevo Rol</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRoleName("");
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del rol
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ej: supervisor"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Solo letras minúsculas, sin espacios. Usa guiones bajos para
                  separar palabras.
                </p>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRoleName("");
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRole}
                disabled={creatingRole || !newRoleName.trim()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
              >
                {creatingRole ? <LoadingSpinner size="sm" /> : <FaPlus />}
                Crear Rol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación eliminar rol */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar Rol"
        message={`¿Estás seguro de eliminar el rol "${confirmDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmColor="red"
        onConfirm={handleDeleteRole}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Confirmación descartar cambios */}
      <ConfirmDialog
        isOpen={!!confirmDiscard}
        title="Descartar Cambios"
        message="Tienes cambios sin guardar. ¿Deseas descartarlos?"
        confirmLabel="Descartar"
        confirmColor="red"
        onConfirm={() => {
          if (confirmDiscard?.nextRole) {
            selectRoleFromData(confirmDiscard.nextRole, roles);
          }
          setConfirmDiscard(false);
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  );
}
