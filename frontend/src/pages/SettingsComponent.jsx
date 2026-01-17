import { useEffect, useState } from "react";
import {
  FaCog,
  FaBuilding,
  FaFileInvoiceDollar,
  FaPrint,
  FaSave,
  FaUpload,
  FaTrash,
  FaSpinner,
  FaImage,
} from "react-icons/fa";
import settingsService from "../services/settingsService";
import { getErrorMessage } from "../utils/errorTranslator";
import useToast from "../hooks/useToast";
import LoadingSpinner from "../components/LoadingSpinner";

// Tabs disponibles
const TABS = [
  { id: "empresa", label: "Empresa", icon: FaBuilding },
  { id: "facturacion", label: "Facturación e Impuestos", icon: FaFileInvoiceDollar },
  { id: "impresion", label: "Impresión y Tickets", icon: FaPrint },
];

export default function SettingsComponent() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("empresa");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Estado de formulario
  const [settings, setSettings] = useState({
    // Empresa
    nombre_empresa: "",
    ruc_empresa: "",
    direccion_empresa: "",
    telefono_empresa: "",
    email_empresa: "",
    logo_empresa: "",
    // Facturación
    iva_porcentaje: 15,
    ice_porcentaje: 0,
    moneda_simbolo: "$",
    numero_factura_prefijo: "001-001",
    descuento_maximo: 20,
    stock_minimo_alerta: 10,
    // Impresión
    ticket_encabezado: "",
    ticket_pie_pagina: "",
    ticket_mostrar_logo: true,
    imprimir_automatico: false,
  });

  // Estado inicial para detectar cambios
  const [initialSettings, setInitialSettings] = useState({});

  // Cargar configuraciones al montar
  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  // Detectar cambios
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(initialSettings);
    setHasChanges(changed);
  }, [settings, initialSettings]);

  const cargarConfiguraciones = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getAll();
      
      if (response.success && response.data?.flat) {
        const flat = response.data.flat;
        const newSettings = {
          nombre_empresa: flat.nombre_empresa || "",
          ruc_empresa: flat.ruc_empresa || "",
          direccion_empresa: flat.direccion_empresa || "",
          telefono_empresa: flat.telefono_empresa || "",
          email_empresa: flat.email_empresa || "",
          logo_empresa: flat.logo_empresa || "",
          iva_porcentaje: parseFloat(flat.iva_porcentaje) || 15,
          ice_porcentaje: parseFloat(flat.ice_porcentaje) || 0,
          moneda_simbolo: flat.moneda_simbolo || "$",
          numero_factura_prefijo: flat.numero_factura_prefijo || "001-001",
          descuento_maximo: parseFloat(flat.descuento_maximo) || 20,
          stock_minimo_alerta: parseInt(flat.stock_minimo_alerta) || 10,
          ticket_encabezado: flat.ticket_encabezado || "",
          ticket_pie_pagina: flat.ticket_pie_pagina || "",
          ticket_mostrar_logo: flat.ticket_mostrar_logo === true || flat.ticket_mostrar_logo === 1 || flat.ticket_mostrar_logo === "1",
          imprimir_automatico: flat.imprimir_automatico === true || flat.imprimir_automatico === 1 || flat.imprimir_automatico === "1",
        };
        setSettings(newSettings);
        setInitialSettings(newSettings);
      }
    } catch (error) {
      console.error("Error cargando configuraciones:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await settingsService.updateBulk(settings);
      
      if (response.success) {
        toast.success("Configuración guardada exitosamente");
        setInitialSettings({ ...settings });
        setHasChanges(false);
      } else {
        toast.error(response.message || "Error al guardar configuración");
      }
    } catch (error) {
      console.error("Error guardando configuración:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/svg+xml", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato de imagen no válido. Use JPG, PNG, GIF, SVG o WebP.");
      return;
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo es muy grande. Máximo 2MB.");
      return;
    }

    try {
      setUploadingLogo(true);
      const response = await settingsService.uploadLogo(file);
      
      if (response.success) {
        const logoUrl = response.data.url;
        handleChange("logo_empresa", logoUrl);
        setInitialSettings((prev) => ({ ...prev, logo_empresa: logoUrl }));
        toast.success("Logo subido exitosamente");
      }
    } catch (error) {
      console.error("Error subiendo logo:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleLogoDelete = async () => {
    if (!settings.logo_empresa) return;

    try {
      setUploadingLogo(true);
      const response = await settingsService.deleteLogo();
      
      if (response.success) {
        handleChange("logo_empresa", "");
        setInitialSettings((prev) => ({ ...prev, logo_empresa: "" }));
        toast.success("Logo eliminado exitosamente");
      }
    } catch (error) {
      console.error("Error eliminando logo:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setUploadingLogo(false);
    }
  };

  const getLogoUrl = () => {
    if (!settings.logo_empresa) return null;
    // Si es una URL relativa, agregar la base
    if (settings.logo_empresa.startsWith("/")) {
      return `${import.meta.env.VITE_API_URL?.replace("/api", "")}${settings.logo_empresa}`;
    }
    return settings.logo_empresa;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FaCog className="text-3xl text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h1>
        </div>
        <p className="text-gray-500">
          Administra la información de tu negocio, impuestos y preferencias de impresión.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className={isActive ? "text-indigo-600" : "text-gray-400"} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB: Empresa */}
          {activeTab === "empresa" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos del Negocio</h2>

              {/* Logo Upload */}
              <div className="flex flex-col md:flex-row gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la Empresa</label>
                  <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                    {uploadingLogo ? (
                      <FaSpinner className="animate-spin text-3xl text-indigo-500" />
                    ) : settings.logo_empresa ? (
                      <img
                        src={getLogoUrl()}
                        alt="Logo empresa"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        <FaImage className="mx-auto text-4xl text-gray-300 mb-2" />
                        <span className="text-xs text-gray-400">Sin logo</span>
                      </div>
                    )}
                    {settings.logo_empresa && (
                      <div className="hidden flex-col items-center justify-center">
                        <FaImage className="text-4xl text-gray-300 mb-2" />
                        <span className="text-xs text-gray-400">Error al cargar</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-3">
                    Sube el logo de tu empresa. Formatos aceptados: JPG, PNG, GIF, SVG, WebP. Tamaño máximo: 2MB.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                      <FaUpload />
                      <span>{settings.logo_empresa ? "Cambiar Logo" : "Subir Logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                    {settings.logo_empresa && (
                      <button
                        onClick={handleLogoDelete}
                        disabled={uploadingLogo}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <FaTrash />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Negocio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.nombre_empresa}
                    onChange={(e) => handleChange("nombre_empresa", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Mi Empresa S.A."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUC / ID Legal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.ruc_empresa}
                    onChange={(e) => handleChange("ruc_empresa", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="1234567890001"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={settings.direccion_empresa}
                    onChange={(e) => handleChange("direccion_empresa", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Av. Principal 123, Ciudad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={settings.telefono_empresa}
                    onChange={(e) => handleChange("telefono_empresa", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="+593 2 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={settings.email_empresa}
                    onChange={(e) => handleChange("email_empresa", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="info@empresa.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: Facturación e Impuestos */}
          {activeTab === "facturacion" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuración de Facturación</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    % IVA por Defecto <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={settings.iva_porcentaje}
                      onChange={(e) => handleChange("iva_porcentaje", parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Porcentaje de IVA aplicado en facturas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">% ICE por Defecto</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={settings.ice_porcentaje}
                      onChange={(e) => handleChange("ice_porcentaje", parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Impuesto a Consumos Especiales (bebidas, cigarrillos, etc.)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Símbolo de Moneda</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={settings.moneda_simbolo}
                    onChange={(e) => handleChange("moneda_simbolo", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="$"
                  />
                  <p className="mt-1 text-xs text-gray-500">Símbolo que aparecerá en precios</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefijo de Factura</label>
                  <input
                    type="text"
                    value={settings.numero_factura_prefijo}
                    onChange={(e) => handleChange("numero_factura_prefijo", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="001-001"
                  />
                  <p className="mt-1 text-xs text-gray-500">Prefijo para numeración de facturas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descuento Máximo (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.descuento_maximo}
                      onChange={(e) => handleChange("descuento_maximo", parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Máximo descuento permitido en ventas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Límite Stock Bajo (Alertas)</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.stock_minimo_alerta}
                    onChange={(e) => handleChange("stock_minimo_alerta", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="10"
                  />
                  <p className="mt-1 text-xs text-gray-500">Umbral para alertas de stock bajo</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Impresión y Tickets */}
          {activeTab === "impresion" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuración de Impresión</h2>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Encabezado del Ticket</label>
                  <input
                    type="text"
                    value={settings.ticket_encabezado}
                    onChange={(e) => handleChange("ticket_encabezado", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="*** COMPROBANTE DE VENTA ***"
                  />
                  <p className="mt-1 text-xs text-gray-500">Texto que aparece al inicio del ticket</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pie de Página del Ticket</label>
                  <textarea
                    rows={2}
                    value={settings.ticket_pie_pagina}
                    onChange={(e) => handleChange("ticket_pie_pagina", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="¡Gracias por su compra! Vuelva pronto."
                  />
                  <p className="mt-1 text-xs text-gray-500">Mensaje de despedida al final del ticket</p>
                </div>

                {/* Toggle Options */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">Opciones de Impresión</h3>

                  {/* Toggle: Mostrar Logo */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">Mostrar Logo en Ticket</p>
                      <p className="text-sm text-gray-500">Incluir el logo de la empresa en tickets impresos</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle("ticket_mostrar_logo")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.ticket_mostrar_logo ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.ticket_mostrar_logo ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle: Impresión automática */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">Imprimir Automáticamente al Cobrar</p>
                      <p className="text-sm text-gray-500">Abrir diálogo de impresión al completar una venta</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle("imprimir_automatico")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.imprimir_automatico ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.imprimir_automatico ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg transition-all ${
            hasChanges
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {saving ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <FaSave />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>

      {/* Indicador de cambios sin guardar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-6 z-50">
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-md text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            Tienes cambios sin guardar
          </div>
        </div>
      )}
    </div>
  );
}
