import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  FaUserCog,
  FaSave,
  FaTimes,
  FaUndo,
  FaArrowLeft,
  FaCheckSquare,
  FaSquare,
  FaMinusSquare,
  FaInfoCircle,
} from "react-icons/fa";
import api from "../services/api";
import authService from "../services/authService";
import { getErrorMessage } from "../utils/errorTranslator";
import { useDashboardNavigation, DASHBOARD_SECTIONS } from "../hooks/useDashboardNavigation";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import useToast from "../hooks/useToast";

// ============================
// COLORES POR TIPO DE ACCIÓN
// ============================
const ACTION_COLORS = {
  ver: {
    active: "text-blue-600",
    inactive: "text-gray-300 hover:text-blue-400",
    inherited: "text-blue-400",
    bg: "bg-blue-50",
  },
  crear: {
    active: "text-green-600",
    inactive: "text-gray-300 hover:text-green-400",
    inherited: "text-green-400",
    bg: "bg-green-50",
  },
  editar: {
    active: "text-yellow-500",
    inactive: "text-gray-300 hover:text-yellow-400",
    inherited: "text-amber-400",
    bg: "bg-yellow-50",
  },
  eliminar: {
    active: "text-red-600",
    inactive: "text-gray-300 hover:text-red-400",
    inherited: "text-red-400",
    bg: "bg-red-50",
  },
  gestionar: {
    active: "text-purple-600",
    inactive: "text-gray-300 hover:text-purple-400",
    inherited: "text-purple-400",
    bg: "bg-purple-50",
  },
  exportar: {
    active: "text-teal-600",
    inactive: "text-gray-300 hover:text-teal-400",
    inherited: "text-teal-400",
    bg: "bg-teal-50",
  },
};

const getActionColor = (action, state) => {
  const colors = ACTION_COLORS[action] || ACTION_COLORS.ver;
  return colors[state] || colors.inactive;
};

// ============================
// TRADUCCIÓN DE ACCIONES
// ============================
const ACTIONS_LABELS = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
  gestionar: "Gestionar",
  exportar: "Exportar",
};

export default function PermisosUsuario({ usuarioId: propUsuarioId }) {
  const { navigateTo } = useDashboardNavigation();
  const toast = useToast();
  const currentUser = authService.getUser();
  
  // Usar useRef para mantener una referencia estable del usuarioId
  const usuarioIdRef = useRef(propUsuarioId);
  const usuarioId = usuarioIdRef.current;

  // ============================
  // ESTADOS
  // ============================
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [permissionsMatrix, setPermissionsMatrix] = useState([]);
  const [actionLabels, setActionLabels] = useState({});
  const [summary, setSummary] = useState({});
  
  // Estado de permisos editables (permisos directos seleccionados)
  const [selectedDirectPermissions, setSelectedDirectPermissions] = useState([]);
  const [originalDirectPermissions, setOriginalDirectPermissions] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Confirmaciones
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

  // ============================
  // CARGAR DATOS DEL USUARIO
  // ============================
  const cargarPermisosUsuario = useCallback(async () => {
    if (!usuarioId) return;
    
    setLoading(true);
    try {
      const res = await api.get(`/admin/usuarios/${usuarioId}/permissions-matrix`);
      const data = res.data.data || res.data;
      
      setUserData(data.user);
      setPermissionsMatrix(data.permissions_matrix || []);
      setActionLabels(data.action_labels || ACTIONS_LABELS);
      setSummary(data.summary || {});
      
      // Extraer permisos directos actuales
      const directPerms = [];
      (data.permissions_matrix || []).forEach(module => {
        module.permissions.forEach(perm => {
          if (perm.assigned_directly) {
            directPerms.push(perm.name);
          }
        });
      });
      
      setSelectedDirectPermissions([...directPerms]);
      setOriginalDirectPermissions([...directPerms]);
      setHasChanges(false);
      
    } catch (error) {
      console.error("Error cargando permisos del usuario:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId]);

  useEffect(() => {
    cargarPermisosUsuario();
  }, [usuarioId]); // Solo depender de usuarioId, no de la función

  // Detectar cambios
  useEffect(() => {
    const original = [...originalDirectPermissions].sort();
    const current = [...selectedDirectPermissions].sort();
    setHasChanges(JSON.stringify(original) !== JSON.stringify(current));
  }, [selectedDirectPermissions, originalDirectPermissions]);

  // ============================
  // HELPERS PARA CHECKBOXES
  // ============================

  // Obtener todos los permisos editables (no heredados) de un módulo
  const getEditablePermissionsForModule = (moduleKey) => {
    const module = permissionsMatrix.find(m => m.key === moduleKey);
    if (!module) return [];
    return module.permissions.filter(p => !p.inherited_from_role).map(p => p.name);
  };

  // Obtener todos los permisos editables de una acción (columna)
  const getEditablePermissionsForAction = (actionKey) => {
    const perms = [];
    permissionsMatrix.forEach(module => {
      module.permissions.forEach(perm => {
        if (perm.action === actionKey && !perm.inherited_from_role) {
          perms.push(perm.name);
        }
      });
    });
    return perms;
  };

  // Estado del checkbox del módulo (fila) - solo considera editables
  const getModuleCheckState = (moduleKey) => {
    const editablePerms = getEditablePermissionsForModule(moduleKey);
    if (editablePerms.length === 0) return "locked"; // Todos heredados
    const checkedCount = editablePerms.filter(p => selectedDirectPermissions.includes(p)).length;
    if (checkedCount === 0) return "none";
    if (checkedCount === editablePerms.length) return "all";
    return "partial";
  };

  // Estado del checkbox de la acción (columna) - solo considera editables
  const getActionCheckState = (actionKey) => {
    const editablePerms = getEditablePermissionsForAction(actionKey);
    if (editablePerms.length === 0) return "locked"; // Todos heredados
    const checkedCount = editablePerms.filter(p => selectedDirectPermissions.includes(p)).length;
    if (checkedCount === 0) return "none";
    if (checkedCount === editablePerms.length) return "all";
    return "partial";
  };

  // Toggle todos los permisos editables de un módulo
  const toggleModule = (moduleKey) => {
    const editablePerms = getEditablePermissionsForModule(moduleKey);
    if (editablePerms.length === 0) return;
    
    const allChecked = editablePerms.every(p => selectedDirectPermissions.includes(p));
    
    setSelectedDirectPermissions(prev => {
      if (allChecked) {
        return prev.filter(p => !editablePerms.includes(p));
      } else {
        return [...new Set([...prev, ...editablePerms])];
      }
    });
  };

  // Toggle todos los permisos editables de una acción
  const toggleAction = (actionKey) => {
    const editablePerms = getEditablePermissionsForAction(actionKey);
    if (editablePerms.length === 0) return;
    
    const allChecked = editablePerms.every(p => selectedDirectPermissions.includes(p));
    
    setSelectedDirectPermissions(prev => {
      if (allChecked) {
        return prev.filter(p => !editablePerms.includes(p));
      } else {
        return [...new Set([...prev, ...editablePerms])];
      }
    });
  };

  // ============================
  // HANDLERS
  // ============================
  
  // Toggle permiso directo
  const handleTogglePermission = (permission) => {
    // Si es heredado del rol, no hacer nada
    if (permission.inherited_from_role) {
      return;
    }

    setSelectedDirectPermissions(prev => {
      if (prev.includes(permission.name)) {
        return prev.filter(p => p !== permission.name);
      } else {
        return [...prev, permission.name];
      }
    });
  };

  // Guardar cambios
  const handleSave = async () => {
    setSaving(true);
    try {
      // Combinar permisos heredados + directos seleccionados
      // El backend se encargará de filtrar solo los directos
      const inheritedPerms = [];
      permissionsMatrix.forEach(module => {
        module.permissions.forEach(perm => {
          if (perm.inherited_from_role) {
            inheritedPerms.push(perm.name);
          }
        });
      });
      
      // Enviamos todos los permisos que el usuario debería tener
      const allPermissions = [...new Set([...inheritedPerms, ...selectedDirectPermissions])];
      
      await api.put(`/admin/usuarios/${usuarioId}/permissions`, {
        permissions: allPermissions
      });
      
      toast.success("Permisos actualizados correctamente");
      
      // Recargar para obtener estado actualizado
      await cargarPermisosUsuario();
      
    } catch (error) {
      console.error("Error guardando permisos:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Descartar cambios (usado por el botón en la barra inferior)
  const handleDiscard = () => {
    setSelectedDirectPermissions([...originalDirectPermissions]);
    setHasChanges(false);
    setConfirmDiscard(false);
    toast.info("Cambios descartados");
  };

  // Descartar y volver (usado cuando confirma desde el botón de volver)
  const handleDiscardAndBack = () => {
    setConfirmDiscard(false);
    navigateTo(DASHBOARD_SECTIONS.USUARIOS);
  };

  // Volver a la lista de usuarios
  const handleBack = () => {
    if (hasChanges) {
      setConfirmDiscard(true);
    } else {
      navigateTo(DASHBOARD_SECTIONS.USUARIOS);
    }
  };

  // ============================
  // DETERMINAR ESTADO DEL CHECKBOX
  // ============================
  const getPermissionState = (permission) => {
    if (permission.inherited_from_role) {
      return "inherited"; // Bloqueado, heredado del rol
    }
    if (selectedDirectPermissions.includes(permission.name)) {
      return "active"; // Asignado directamente
    }
    return "inactive"; // No asignado
  };

  // ============================
  // RENDER
  // ============================

  // Si no hay usuarioId, mostrar error
  if (!usuarioId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FaUserCog className="text-gray-400 text-6xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Usuario no seleccionado</h2>
          <p className="text-gray-500 mt-2">Seleccione un usuario desde la lista de usuarios.</p>
          <button
            onClick={() => navigateTo(DASHBOARD_SECTIONS.USUARIOS)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Ir a Usuarios
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaUserCog className="text-indigo-600" />
              Permisos de Usuario
            </h1>
            {userData && (
              <p className="text-gray-600 mt-1">
                {userData.nombre} ({userData.email})
              </p>
            )}
          </div>
        </div>
        
        {/* Roles del usuario */}
        {userData?.roles_labels && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Roles:</span>
            {userData.roles_labels.map((roleLabel, idx) => (
              <span
                key={idx}
                className="px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-700"
              >
                {roleLabel}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <FaInfoCircle className="text-gray-400" />
            <span className="font-medium text-gray-700">Leyenda:</span>
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <FaCheckSquare className="text-blue-400" />
            <span className="text-gray-600">Heredado del rol (no editable)</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCheckSquare className="text-green-600" />
            <span className="text-gray-600">Permiso directo activo</span>
          </div>
          <div className="flex items-center gap-2">
            <FaSquare className="text-gray-300" />
            <span className="text-gray-600">Sin permiso (clic para agregar)</span>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{summary.total_permissions || 0}</div>
          <div className="text-sm text-gray-500">Total de Permisos</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.inherited_count || 0}</div>
          <div className="text-sm text-gray-500">Heredados del Rol</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{summary.direct_count || 0}</div>
          <div className="text-sm text-gray-500">Permisos Directos</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{summary.effective_count || 0}</div>
          <div className="text-sm text-gray-500">Permisos Efectivos</div>
        </div>
      </div>

      {/* Matriz de Permisos */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[180px]">
                  Módulo
                </th>
                {Object.entries(actionLabels).map(([key, label]) => {
                  const actionState = getActionCheckState(key);
                  const colorClass = ACTION_COLORS[key]?.active || "text-gray-600";
                  
                  return (
                    <th
                      key={key}
                      className="px-3 py-2 text-center text-sm font-semibold text-gray-700 min-w-[80px]"
                    >
                      <button
                        onClick={() => toggleAction(key)}
                        disabled={actionState === "locked" || saving}
                        className={`flex flex-col items-center gap-0.5 mx-auto ${
                          actionState !== "locked" && !saving
                            ? "hover:opacity-70 cursor-pointer"
                            : "cursor-not-allowed opacity-50"
                        }`}
                        title={
                          actionState === "locked"
                            ? "Todos los permisos de esta acción son heredados"
                            : `Marcar/desmarcar todos: ${label}`
                        }
                      >
                        <span className="text-xs uppercase tracking-wide">{label}</span>
                        <span>
                          {actionState === "all" && <FaCheckSquare className={colorClass} />}
                          {actionState === "partial" && <FaMinusSquare className={colorClass} />}
                          {(actionState === "none" || actionState === "locked") && <FaSquare className="text-gray-300" />}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {permissionsMatrix.map((module) => {
                const moduleState = getModuleCheckState(module.key);
                
                return (
                  <tr key={module.key} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10">
                      <button
                        onClick={() => toggleModule(module.key)}
                        disabled={moduleState === "locked" || saving}
                        className={`flex items-center gap-2 font-medium text-gray-900 ${
                          moduleState !== "locked" && !saving
                            ? "hover:text-indigo-600 cursor-pointer"
                            : "cursor-not-allowed opacity-50"
                        }`}
                        title={
                          moduleState === "locked"
                            ? "Todos los permisos de este módulo son heredados"
                            : "Marcar/desmarcar todos los permisos del módulo"
                        }
                      >
                        <span>
                          {moduleState === "all" && <FaCheckSquare className="text-indigo-600" />}
                          {moduleState === "partial" && <FaMinusSquare className="text-indigo-400" />}
                          {(moduleState === "none" || moduleState === "locked") && <FaSquare className="text-gray-300" />}
                        </span>
                        {module.label}
                      </button>
                    </td>
                    {Object.keys(actionLabels).map((actionKey) => {
                      const permission = module.permissions.find(p => p.action === actionKey);
                    
                      if (!permission) {
                        return (
                          <td key={actionKey} className="px-3 py-3 text-center">
                            <span className="text-gray-200">—</span>
                          </td>
                        );
                      }

                      const state = getPermissionState(permission);
                      const isInherited = state === "inherited";
                      const isActive = state === "active" || state === "inherited";

                      return (
                        <td key={actionKey} className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleTogglePermission(permission)}
                            disabled={isInherited || saving}
                            className={`
                              inline-flex items-center justify-center p-1 rounded transition-all
                              ${isInherited ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"}
                              ${saving ? "opacity-50" : ""}
                            `}
                            title={
                              isInherited
                                ? `Heredado de: ${permission.inherited_from_roles?.join(", ")}`
                                : isActive
                                ? "Clic para quitar permiso directo"
                                : "Clic para agregar permiso directo"
                            }
                          >
                            {isActive ? (
                              <FaCheckSquare
                                className={
                                  isInherited
                                    ? getActionColor(actionKey, "inherited")
                                    : getActionColor(actionKey, "active")
                                }
                              />
                            ) : (
                              <FaSquare
                                className={getActionColor(actionKey, "inactive")}
                              />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra de acciones fija */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-600">
              <FaInfoCircle />
              <span className="text-sm font-medium">
                Tienes cambios sin guardar
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmDiscard(true)}
                disabled={saving}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <FaUndo size={14} />
                Descartar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FaSave size={14} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Espaciador para la barra fija */}
      {hasChanges && <div className="h-20" />}

      {/* Modal de confirmación para descartar */}
      <ConfirmDialog
        isOpen={confirmDiscard}
        title="Descartar cambios"
        message="¿Está seguro de que desea descartar los cambios y volver a la lista de usuarios?"
        confirmLabel="Descartar y Volver"
        cancelLabel="Cancelar"
        onConfirm={handleDiscardAndBack}
        onCancel={() => setConfirmDiscard(false)}
        variant="warning"
      />
    </div>
  );
}
