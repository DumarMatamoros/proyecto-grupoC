import { useState, useEffect, useMemo } from "react";
import { FaBox, FaPlus, FaEdit, FaTrash, FaTimes, FaFileImport, FaSlidersH, FaBan, FaCheck, FaExclamationTriangle, FaCamera, FaCloudUploadAlt, FaDownload, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import api from "../services/api";
import { getErrorMessage } from "../utils/errorTranslator";
import { PRODUCT_LIMITS } from "../utils/validationLimits";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ImageWithFallback from "../components/ImageWithFallback";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import DataTable from "../components/DataTable";
import useToast from "../hooks/useToast";

export default function InventoryPage() {
  const toast = useToast();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(null); // Para mostrar opciones cuando tiene relaciones
  const [togglingEstado, setTogglingEstado] = useState(null); // ID del producto que está cambiando estado

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importModal, setImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importUploading, setImportUploading] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [initialForm, setInitialForm] = useState(null);
  const [visibleCols, setVisibleCols] = useState({
    imagen: true,
    codigo: true,
    codigo_barras: true,
    descripcion: true,
    categoria: true,
    stock: true,
    precio_costo: true,
    precio_venta: true,
    precio_final: true,
    iva: true,
    ice: true,
    vencimiento: true,
    ultimo_ingreso: false,
    estado: true,
    // Nuevos campos de control (ocultos por defecto)
    sku: false,
    marca: false,
    unidad_medida: false,
    proveedor: false,
    ubicacion: false,
  });

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Cambiado a 20 estilo Gmail

  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [form, setForm] = useState({
    codigo_principal: "",
    codigo_barras: "",
    nombre: "",
    descripcion: "",
    precio_costo: "",
    precio_unitario: "",
    stock_actual: "",
    categoria_id: "",
    imagen: null,
    iva_aplica: 0,
    ice_aplica: 0,
    iva_porcentaje: "15.00",
    ice_porcentaje: "0.00",
    numero_lote: "", // Lote inicial para el stock
    fecha_vencimiento: "", // Fecha de caducidad del lote
    // Campos de identificación y control
    unidad_medida: "unidad",
    marca: "",
    proveedor_principal_id: "",
    sku: "",
    ubicacion_bodega: "",
    // Configuración de precios
    margen_ganancia: "30.00",
    modo_precio: "automatico",
  });

  // ============================
  // CARGAR DATOS
  // ============================
  const cargarProductos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/productos");
      setProductos(res.data);
    } catch (error) {
      console.error("Error cargando productos:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      console.log("Llamando a /categorias...");
      const res = await api.get("/categorias");
      console.log("Respuesta categorías:", res);
      console.log("res.data:", res.data);
      // El backend devuelve directamente un array
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      console.log("Categorías procesadas:", data);
      setCategorias(data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
      console.error("Error response:", error.response);
      toast.error("Error al cargar categorías");
      setCategorias([]);
    }
  };

  const cargarProveedores = async () => {
    try {
      const res = await api.get("/proveedores?per_page=1000");
      // La API devuelve { success: true, data: { data: [...] } } con paginación
      const data = res.data?.data?.data || res.data?.data || res.data || [];
      setProveedores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando proveedores:", error);
      setProveedores([]);
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
    cargarProveedores();
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

    // Lógica especial para modo automático de precios
    let newForm = { ...form, [name]: value };

    // Si cambia el costo o margen y modo es automático → recalcular precio
    if ((name === "precio_costo" || name === "margen_ganancia") && form.modo_precio === "automatico") {
      const costo = parseFloat(name === "precio_costo" ? value : form.precio_costo) || 0;
      const margen = parseFloat(name === "margen_ganancia" ? value : form.margen_ganancia) || 0;
      if (costo > 0) {
        newForm.precio_unitario = (costo * (1 + margen / 100)).toFixed(2);
      }
    }

    // Si cambia a modo automático → recalcular precio inmediatamente
    if (name === "modo_precio" && value === "automatico") {
      const costo = parseFloat(form.precio_costo) || 0;
      const margen = parseFloat(form.margen_ganancia) || 0;
      if (costo > 0) {
        newForm.precio_unitario = (costo * (1 + margen / 100)).toFixed(2);
      }
    }

    setForm(newForm);
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
  const emptyForm = {
    codigo_principal: "",
    codigo_barras: "",
    nombre: "",
    descripcion: "",
    precio_costo: "",
    precio_unitario: "",
    stock_actual: "",
    categoria_id: "",
    imagen: null,
    iva_aplica: 0,
    ice_aplica: 0,
    iva_porcentaje: "15.00",
    ice_porcentaje: "0.00",
    numero_lote: "", // Lote inicial para el stock
    fecha_vencimiento: "", // Fecha de caducidad del lote
    // Campos de identificación y control
    unidad_medida: "unidad",
    marca: "",
    proveedor_principal_id: "",
    sku: "",
    ubicacion_bodega: "",
    // Configuración de precios
    margen_ganancia: "30.00",
    modo_precio: "automatico",
  };

  // ============================
  // CÁLCULO DE PRECIO SUGERIDO (basado en costo + margen)
  // ============================
  const calcularPrecioSugerido = () => {
    const costo = parseFloat(form.precio_costo) || 0;
    const margen = parseFloat(form.margen_ganancia) || 0;
    return costo > 0 ? (costo * (1 + margen / 100)).toFixed(2) : "0.00";
  };

  // ============================
  // CÁLCULO DE PRECIO FINAL CON IMPUESTOS
  // ============================
  const calcularPrecioFinal = () => {
    const precioBase = parseFloat(form.precio_unitario) || 0;
    const ivaPorcentaje = form.iva_aplica ? (parseFloat(form.iva_porcentaje) || 0) : 0;
    const icePorcentaje = form.ice_aplica ? (parseFloat(form.ice_porcentaje) || 0) : 0;
    
    const ivaValor = precioBase * (ivaPorcentaje / 100);
    const iceValor = precioBase * (icePorcentaje / 100);
    const precioFinal = precioBase + ivaValor + iceValor;
    
    return {
      precioBase: precioBase.toFixed(2),
      ivaPorcentaje: ivaPorcentaje.toFixed(2),
      ivaValor: ivaValor.toFixed(2),
      icePorcentaje: icePorcentaje.toFixed(2),
      iceValor: iceValor.toFixed(2),
      precioFinal: precioFinal.toFixed(2),
    };
  };

  const abrirNuevo = () => {
    setEditing(null);
    setForm(emptyForm);
    setInitialForm(emptyForm);
    setPreview(null);
    setModal(true);
  };

  // ============================
  // DETECTAR CAMBIOS EN FORMULARIO
  // ============================
  const hasFormChanges = () => {
    if (!initialForm) return false;
    
    // Comparar cada campo excepto imagen (se compara por separado)
    const fieldsToCompare = ['codigo_principal', 'codigo_barras', 'nombre', 'descripcion', 
      'precio_costo', 'precio_unitario', 'stock_actual', 'categoria_id', 'iva_aplica', 'ice_aplica',
      'iva_porcentaje', 'ice_porcentaje'];
    
    for (const field of fieldsToCompare) {
      if (String(form[field] || '') !== String(initialForm[field] || '')) {
        return true;
      }
    }
    
    // Verificar si se seleccionó una nueva imagen
    if (form.imagen instanceof File) {
      return true;
    }
    
    return false;
  };

  const handleCloseModal = () => {
    if (hasFormChanges()) {
      setConfirmDiscard(true);
    } else {
      setModal(false);
    }
  };

  const handleConfirmDiscard = () => {
    setConfirmDiscard(false);
    setModal(false);
  };

  const handleBackdropClick = (e) => {
    // Solo cerrar si se hace clic en el backdrop, no en el contenido
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  // ============================
  // IMPORTACIÓN MASIVA
  // ============================
  const openImport = () => {
    setImportModal(true);
    setImportPreview(null);
  };

  const handleCloseImportModal = (e) => {
    // Si hay preview, pedir confirmación
    if (importPreview) {
      // Cerrar directamente, el usuario puede volver a importar
      setImportModal(false);
      setImportPreview(null);
    } else {
      setImportModal(false);
    }
  };

  const handleImportBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseImportModal(e);
    }
  };

  const uploadPreview = async (file) => {
    if (!file) return;
    try {
      setImportUploading(true);
      const formData = new FormData();
      formData.append('archivo', file);
      const res = await api.post('/productos/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportPreview(res.data);
      toast.info(`Se detectaron ${res.data.count} filas`);
    } catch (error) {
      console.error('Error en previsualización:', error);
      toast.error(getErrorMessage(error) || 'Error al previsualizar');
    } finally {
      setImportUploading(false);
    }
  };

  const confirmImport = async () => {
    if (!importPreview?.preview?.length) return;
    try {
      setImportUploading(true);
      const res = await api.post('/productos/import/confirm', { rows: importPreview.preview });
      toast.success(`Importación: creados ${res.data.created}, actualizados ${res.data.updated}`);
      if (res.data.errors?.length) {
        toast.warning(`Errores: ${res.data.errors.length}`);
      }
      setImportModal(false);
      setImportPreview(null);
      cargarProductos();
    } catch (error) {
      console.error('Error confirmando importación:', error);
      toast.error(getErrorMessage(error) || 'Error al confirmar importación');
    } finally {
      setImportUploading(false);
    }
  };

  // ============================
  // DESCARGAR PLANTILLA EXCEL
  // ============================
  const descargarPlantillaExcel = () => {
    // Definir datos con encabezados amigables y descripción
    const datosPlantilla = [
      // Fila de instrucciones
      ['📋 PLANTILLA DE IMPORTACIÓN DE PRODUCTOS - Complete los datos desde la fila 4'],
      ['⚠️ NO modificar los encabezados de la fila 3. Los campos marcados con * son obligatorios.'],
      [], // Fila vacía de separación
      // Encabezados con nombres amigables
      [
        'Código Principal *',
        'Código de Barras',
        'Nombre del Producto *',
        'Descripción',
        'Precio de Costo ($)',
        'Precio de Venta ($)',
        'Stock Inicial',
        'Categoría',
        'Aplica IVA (1=Sí, 0=No)',
        'Aplica ICE (1=Sí, 0=No)',
        'Número de Lote',
        'Fecha Vencimiento (AAAA-MM-DD)',
        'Margen de Ganancia (%)',
        'Modo de Precio'
      ],
      // Fila de ejemplo 1
      [
        'PROD001',
        '7501234567890',
        'Coca Cola 500ml',
        'Bebida gaseosa',
        0.80,
        1.25,
        100,
        'Bebidas',
        1,
        0,
        'LOTE-001',
        '2027-12-31',
        30,
        'automatico'
      ],
      // Fila de ejemplo 2
      [
        'PROD002',
        '7509876543210',
        'Galletas María 200g',
        'Paquete de galletas',
        0.50,
        0.85,
        50,
        'Snacks',
        1,
        0,
        'LOTE-002',
        '2026-06-15',
        40,
        'manual'
      ],
      // Fila de ejemplo 3 (mínimo requerido)
      [
        'PROD003',
        '',
        'Producto Básico',
        '',
        '',
        1.00,
        '',
        '',
        1,
        0,
        '',
        '',
        30,
        'automatico'
      ],
    ];

    // Hoja de instrucciones
    const instrucciones = [
      ['📘 GUÍA DE CAMPOS'],
      [],
      ['Campo', 'Obligatorio', 'Descripción', 'Ejemplo'],
      ['Código Principal', 'SÍ', 'Código único del producto', 'PROD001'],
      ['Código de Barras', 'NO', 'Código de barras EAN/UPC', '7501234567890'],
      ['Nombre del Producto', 'SÍ', 'Nombre comercial del producto', 'Coca Cola 500ml'],
      ['Descripción', 'NO', 'Detalle adicional del producto', 'Bebida gaseosa'],
      ['Precio de Costo', 'NO', 'Costo de adquisición', '0.80'],
      ['Precio de Venta', 'NO', 'Precio al público', '1.25'],
      ['Stock Inicial', 'NO', 'Cantidad inicial en inventario', '100'],
      ['Categoría', 'NO', 'Nombre de la categoría (se crea si no existe)', 'Bebidas'],
      ['Aplica IVA', 'NO', '1 = Sí aplica IVA, 0 = No aplica', '1'],
      ['Aplica ICE', 'NO', '1 = Sí aplica ICE, 0 = No aplica', '0'],
      ['Número de Lote', 'NO', 'Identificador del lote (se genera automático si vacío)', 'LOTE-001'],
      ['Fecha Vencimiento', 'NO', 'Formato: AAAA-MM-DD', '2027-12-31'],
      ['Margen de Ganancia', 'NO', 'Porcentaje de ganancia (default: 30)', '30'],
      ['Modo de Precio', 'NO', '"automatico" = recalcula precio, "manual" = precio fijo', 'automatico'],
      [],
      ['💡 CONSEJOS:'],
      ['• Si el código_principal ya existe, se actualizará el producto'],
      ['• Si incluyes stock_actual, se creará automáticamente un lote'],
      ['• Las categorías nuevas se crean automáticamente'],
      ['• Puedes dejar campos opcionales vacíos'],
    ];

    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    
    // Hoja principal de datos
    const ws = XLSX.utils.aoa_to_sheet(datosPlantilla);
    
    // Ajustar anchos de columnas
    ws['!cols'] = [
      { wch: 18 }, // Código Principal
      { wch: 16 }, // Código Barras
      { wch: 25 }, // Nombre
      { wch: 25 }, // Descripción
      { wch: 16 }, // Precio Costo
      { wch: 16 }, // Precio Venta
      { wch: 12 }, // Stock
      { wch: 15 }, // Categoría
      { wch: 18 }, // IVA
      { wch: 18 }, // ICE
      { wch: 15 }, // Lote
      { wch: 22 }, // Fecha Vencimiento
      { wch: 18 }, // Margen
      { wch: 15 }, // Modo
    ];

    // Hoja de instrucciones
    const wsInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
    wsInstrucciones['!cols'] = [
      { wch: 20 },
      { wch: 12 },
      { wch: 45 },
      { wch: 20 },
    ];

    // Agregar hojas al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones');

    // Descargar archivo
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
    toast.success('Plantilla Excel descargada correctamente');
  };

  // ============================
  // EDITAR PRODUCTO
  // ============================
  const abrirEditar = (p) => {
    setEditing(p.producto_id);
    const formData = {
      codigo_principal: p.codigo_principal,
      codigo_barras: p.codigo_barras || "",
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      precio_costo: p.precio_costo || "",
      precio_unitario: p.precio_unitario,
      stock_actual: p.stock_actual,
      categoria_id: p.categoria_id || "",
      iva_aplica: p.iva_aplica ? 1 : 0,
      ice_aplica: p.ice_aplica ? 1 : 0,
      iva_porcentaje: p.iva_porcentaje || "15.00",
      ice_porcentaje: p.ice_porcentaje || "0.00",
      imagen: null,
      // Campos de identificación y control
      unidad_medida: p.unidad_medida || "unidad",
      marca: p.marca || "",
      proveedor_principal_id: p.proveedor_principal_id || "",
      sku: p.sku || "",
      ubicacion_bodega: p.ubicacion_bodega || "",
      // Configuración de precios
      margen_ganancia: p.margen_ganancia || "30.00",
      modo_precio: p.modo_precio || "automatico",
    };
    setForm(formData);
    setInitialForm(formData);

    setPreview(p.imagen ? `http://127.0.0.1:8000/storage/${p.imagen}` : null);
    setModal(true);
  };

  // ============================
  // CREAR O ACTUALIZAR
  // ============================
  const guardarProducto = async () => {
        // Validación: Si hay stock inicial, la fecha de vencimiento es obligatoria
        if (!editing && parseInt(form.stock_actual) > 0 && !form.fecha_vencimiento) {
          toast.error("La fecha de vencimiento es obligatoria cuando hay stock inicial");
          return;
        }

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

            toast.success("Producto actualizado correctamente");
          } else {
            await api.post(`/productos`, data, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Producto creado correctamente");
          }

          setModal(false);
          cargarProductos();

        } catch (error) {
          console.error("Error:", error.response?.data || error);
          toast.error(getErrorMessage(error));
        }
      };

  // ============================
  // ELIMINAR
  // ============================
  const eliminarProducto = (id) => {
    console.log("eliminarProducto llamado con id:", id);
    setConfirmDelete(id);
  };

  const confirmarEliminar = async (forzar = false) => {
    try {
      setDeleting(true);
      const url = forzar ? `/productos/${confirmDelete}?forzar=1` : `/productos/${confirmDelete}`;
      await api.delete(url);
      toast.success("Producto eliminado correctamente");
      setConfirmDelete(null);
      setShowDeleteOptions(null);
      cargarProductos();
    } catch (error) {
      console.error("Error eliminando producto:", error);
      // Si el error indica que tiene relaciones, mostrar opciones
      if (error.response?.data?.tiene_relaciones) {
        setShowDeleteOptions(confirmDelete);
        setConfirmDelete(null);
      } else {
        toast.error(getErrorMessage(error) || "Error al eliminar producto");
      }
    } finally {
      setDeleting(false);
    }
  };

  // Eliminar forzadamente (con relaciones)
  const eliminarForzado = async () => {
    try {
      setDeleting(true);
      await api.delete(`/productos/${showDeleteOptions}?forzar=1`);
      toast.success("Producto eliminado completamente");
      setShowDeleteOptions(null);
      cargarProductos();
    } catch (error) {
      console.error("Error eliminando producto:", error);
      toast.error(getErrorMessage(error) || "Error al eliminar producto");
    } finally {
      setDeleting(false);
    }
  };

  // Desactivar producto
  const desactivarProducto = async () => {
    try {
      setDeleting(true);
      await api.patch(`/productos/${showDeleteOptions}/estado`);
      toast.success("Producto desactivado correctamente");
      setShowDeleteOptions(null);
      cargarProductos();
    } catch (error) {
      console.error("Error desactivando producto:", error);
      toast.error(getErrorMessage(error) || "Error al desactivar producto");
    } finally {
      setDeleting(false);
    }
  };

  // Cambiar estado (activar/desactivar) desde botón directo
  const toggleEstado = async (id) => {
    try {
      setTogglingEstado(id);
      const response = await api.patch(`/productos/${id}/estado`);
      toast.success(response.data.message);
      cargarProductos();
    } catch (error) {
      console.error("Error cambiando estado:", error);
      toast.error(getErrorMessage(error) || "Error al cambiar estado");
    } finally {
      setTogglingEstado(null);
    }
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
  // DATOS PAGINADOS
  // ============================
  const productosPaginados = useMemo(() => {
    return productosFiltrados.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [productosFiltrados, currentPage, itemsPerPage]);

  // ============================
  // DEFINICIÓN DE COLUMNAS PARA DATATABLE
  // ============================
  const tableColumns = useMemo(() => {
    const cols = [];

    if (visibleCols.imagen) {
      cols.push({
        accessorKey: "imagen",
        header: "Imagen",
        size: 80,
        minSize: 80,
        maxSize: 80,
        enableSorting: false,
        enableResizing: false,
        truncate: false,
        cell: ({ row }) => {
          const imagenUrl = row.original.imagen
            ? `http://127.0.0.1:8000/storage/${row.original.imagen}`
            : null;
          return (
            <div className="flex justify-center">
              <ImageWithFallback
                src={imagenUrl}
                alt={row.original.nombre}
                className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm"
                enableLightbox={true}
              />
            </div>
          );
        },
      });
    }

    if (visibleCols.codigo) {
      cols.push({
        accessorKey: "codigo_principal",
        header: "Código",
        size: 100,
        minSize: 100,
        maxWidth: 120,
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() || "-"}</span>
        ),
      });
    }

    if (visibleCols.codigo_barras) {
      cols.push({
        accessorKey: "codigo_barras",
        header: "Cód. Barras",
        size: 120,
        minSize: 120,
        maxWidth: 160,
      });
    }

    // Nombre siempre visible
    cols.push({
      accessorKey: "nombre",
      header: "Nombre",
      size: 180,
      minSize: 100,
      maxWidth: 200,
    });

    if (visibleCols.descripcion) {
      cols.push({
        accessorKey: "descripcion",
        header: "Descripción",
        size: 200,
        minSize: 120,
        maxWidth: 250,
      });
    }

    if (visibleCols.categoria) {
      cols.push({
        accessorKey: "categoria",
        header: "Categoría",
        size: 120,
        minSize: 110,
        maxWidth: 150,
        cell: ({ row }) => row.original.categoria?.nombre || "Sin categoría",
      });
    }

    if (visibleCols.stock) {
      cols.push({
        accessorKey: "stock_actual",
        header: "Stock",
        size: 70,
        minSize: 70,
        maxSize: 90,
        truncate: false,
        cell: ({ getValue }) => (
          <span className="text-center block">{getValue()}</span>
        ),
      });
    }

    if (visibleCols.precio_costo) {
      cols.push({
        accessorKey: "precio_costo",
        header: "P. Costo",
        size: 95,
        minSize: 95,
        maxSize: 120,
        truncate: false,
        cell: ({ getValue }) => `$${getValue() ?? "0.00"}`,
      });
    }

    if (visibleCols.precio_venta) {
      cols.push({
        accessorKey: "precio_unitario",
        header: "P. Venta",
        size: 95,
        minSize: 95,
        maxSize: 120,
        truncate: false,
        cell: ({ getValue }) => `$${getValue()}`,
      });
    }

    if (visibleCols.precio_final) {
      cols.push({
        accessorKey: "precio_final",
        header: "P. Final",
        size: 100,
        minSize: 95,
        maxSize: 130,
        truncate: false,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <span className="font-semibold text-green-600">
              ${p.precio_final || p.precio_unitario}
            </span>
          );
        },
      });
    }

    if (visibleCols.iva) {
      cols.push({
        accessorKey: "iva_aplica",
        header: "IVA",
        size: 55,
        minSize: 55,
        maxSize: 70,
        truncate: false,
        cell: ({ getValue }) => (
          <span className="text-center block">{getValue() ? "✓" : "✗"}</span>
        ),
      });
    }

    if (visibleCols.ice) {
      cols.push({
        accessorKey: "ice_aplica",
        header: "ICE",
        size: 55,
        minSize: 55,
        maxSize: 70,
        truncate: false,
        cell: ({ getValue }) => (
          <span className="text-center block">{getValue() ? "✓" : "✗"}</span>
        ),
      });
    }

    // Columna de próximo vencimiento
    if (visibleCols.vencimiento) {
      cols.push({
        accessorKey: "proximo_vencimiento",
        header: "Vencimiento",
        size: 110,
        minSize: 100,
        maxSize: 130,
        truncate: false,
        cell: ({ row }) => {
          const fecha = row.original.proximo_vencimiento;
          const lote = row.original.lote_proximo;
          if (!fecha) return <span className="text-gray-400 text-xs">Sin fecha</span>;
          
          const fechaVenc = new Date(fecha);
          const hoy = new Date();
          const diasRestantes = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
          
          let colorClass = "text-green-600 bg-green-50";
          if (diasRestantes < 0) {
            colorClass = "text-red-700 bg-red-100 font-bold";
          } else if (diasRestantes <= 30) {
            colorClass = "text-orange-600 bg-orange-50";
          } else if (diasRestantes <= 90) {
            colorClass = "text-yellow-600 bg-yellow-50";
          }
          
          return (
            <div className={`px-2 py-1 rounded text-xs ${colorClass}`} title={lote ? `Lote: ${lote}` : ''}>
              {fechaVenc.toLocaleDateString('es-EC')}
              {diasRestantes < 0 && <span className="block text-[10px]">¡Vencido!</span>}
              {diasRestantes >= 0 && diasRestantes <= 30 && <span className="block text-[10px]">{diasRestantes}d</span>}
            </div>
          );
        },
      });
    }

    // Columna de último ingreso
    if (visibleCols.ultimo_ingreso) {
      cols.push({
        accessorKey: "ultimo_ingreso",
        header: "Últ. Ingreso",
        size: 100,
        minSize: 90,
        maxSize: 120,
        truncate: false,
        cell: ({ getValue }) => {
          const fecha = getValue();
          if (!fecha) return <span className="text-gray-400 text-xs">-</span>;
          return (
            <span className="text-xs text-gray-600">
              {new Date(fecha).toLocaleDateString('es-EC')}
            </span>
          );
        },
      });
    }

    // Columna SKU
    if (visibleCols.sku) {
      cols.push({
        accessorKey: "sku",
        header: "SKU",
        size: 100,
        minSize: 80,
        maxSize: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue() || "-"}</span>
        ),
      });
    }

    // Columna Marca
    if (visibleCols.marca) {
      cols.push({
        accessorKey: "marca",
        header: "Marca",
        size: 100,
        minSize: 80,
        maxSize: 130,
        cell: ({ getValue }) => getValue() || "-",
      });
    }

    // Columna Unidad de Medida
    if (visibleCols.unidad_medida) {
      cols.push({
        accessorKey: "unidad_medida",
        header: "Unidad",
        size: 80,
        minSize: 70,
        maxSize: 100,
        cell: ({ getValue }) => {
          const unidad = getValue();
          const labels = {
            unidad: "Ud",
            kg: "Kg",
            lb: "Lb",
            caja: "Caja",
            paquete: "Paq",
            litro: "Lt",
            metro: "Mt",
            docena: "Doc",
          };
          return labels[unidad] || unidad || "-";
        },
      });
    }

    // Columna Proveedor Principal
    if (visibleCols.proveedor) {
      cols.push({
        accessorKey: "proveedor_principal",
        header: "Proveedor",
        size: 130,
        minSize: 100,
        maxSize: 160,
        cell: ({ row }) => {
          const prov = row.original.proveedor_principal;
          return prov ? (prov.razon_social || prov.nombre_comercial) : "-";
        },
      });
    }

    // Columna Ubicación
    if (visibleCols.ubicacion) {
      cols.push({
        accessorKey: "ubicacion_bodega",
        header: "Ubicación",
        size: 120,
        minSize: 100,
        maxSize: 150,
        cell: ({ getValue }) => (
          <span className="text-xs">{getValue() || "-"}</span>
        ),
      });
    }

    // Columna de estado
    if (visibleCols.estado) {
      cols.push({
        accessorKey: "estado",
        header: "Estado",
        size: 90,
        minSize: 80,
        maxSize: 100,
        truncate: false,
        cell: ({ row }) => {
          const estado = row.original.estado;
          const isToggling = togglingEstado === row.original.producto_id;
          return (
            <button
              onClick={() => toggleEstado(row.original.producto_id)}
              disabled={isToggling}
              className={`px-2 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                estado === 'activo' 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              } ${isToggling ? 'opacity-50' : ''}`}
              title={estado === 'activo' ? 'Clic para desactivar' : 'Clic para activar'}
            >
              {isToggling ? '...' : estado === 'activo' ? 'Activo' : 'Inactivo'}
            </button>
          );
        },
      });
    }

    // Columna de acciones
    cols.push({
      accessorKey: "acciones",
      header: "Acciones",
      size: 120,
      minSize: 120,
      maxSize: 130,
      enableSorting: false,
      enableResizing: false,
      truncate: false,
      cell: ({ row }) => (
        <div className="flex gap-1 justify-center">
          <button
            onClick={() => abrirEditar(row.original)}
            className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded transition cursor-pointer"
            title="Editar"
          >
            <FaEdit className="text-sm" />
          </button>
          <button
            onClick={() => toggleEstado(row.original.producto_id)}
            disabled={togglingEstado === row.original.producto_id}
            className={`w-8 h-8 flex items-center justify-center text-white rounded transition cursor-pointer ${
              row.original.estado === 'activo' 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
            title={row.original.estado === 'activo' ? 'Desactivar' : 'Activar'}
          >
            {row.original.estado === 'activo' ? <FaBan className="text-sm" /> : <FaCheck className="text-sm" />}
          </button>
          <button
            onClick={() => eliminarProducto(row.original.producto_id)}
            className="w-8 h-8 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded transition cursor-pointer"
            title="Eliminar permanentemente"
          >
            <FaTrash className="text-sm" />
          </button>
        </div>
      ),
    });

    return cols;
  }, [visibleCols, togglingEstado]);

  // ============================
  // VISTA
  // ============================
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaBox className="text-blue-600" />
          Catálogo de Productos
        </h1>
      </div>

      {/* BUSCADOR Y BOTÓN */}
      <div className="flex gap-4 mb-5">
        <input
          placeholder="🔍 Buscar por nombre o código..."
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset a primera página al buscar
          }}
        />
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer"
        >
          <FaPlus /> Agregar Producto
        </button>
        <button
          onClick={openImport}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer"
        >
          <FaFileImport /> Importar CSV
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-lg p-5">
        {loading ? (
          <LoadingSpinner text="Cargando productos..." />
        ) : productos.length === 0 ? (
          <EmptyState
            icon={FaBox}
            title="Sin productos"
            description="No hay productos registrados"
          />
        ) : (
          <>
            {/* Menú de columnas */}
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
                        checked={visibleCols.imagen}
                        onChange={(e) => setVisibleCols({ ...visibleCols, imagen: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Imagen
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.codigo}
                        onChange={(e) => setVisibleCols({ ...visibleCols, codigo: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Código
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.codigo_barras}
                        onChange={(e) => setVisibleCols({ ...visibleCols, codigo_barras: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Código de Barras
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.descripcion}
                        onChange={(e) => setVisibleCols({ ...visibleCols, descripcion: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Descripción
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.categoria}
                        onChange={(e) => setVisibleCols({ ...visibleCols, categoria: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Categoría
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.stock}
                        onChange={(e) => setVisibleCols({ ...visibleCols, stock: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Stock
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.precio_costo}
                        onChange={(e) => setVisibleCols({ ...visibleCols, precio_costo: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Precio de Costo
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.precio_venta}
                        onChange={(e) => setVisibleCols({ ...visibleCols, precio_venta: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Precio de Venta
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.precio_final}
                        onChange={(e) => setVisibleCols({ ...visibleCols, precio_final: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Precio Final (c/impuestos)
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.iva}
                        onChange={(e) => setVisibleCols({ ...visibleCols, iva: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      IVA
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.ice}
                        onChange={(e) => setVisibleCols({ ...visibleCols, ice: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      ICE
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.vencimiento}
                        onChange={(e) => setVisibleCols({ ...visibleCols, vencimiento: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      Vencimiento
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.ultimo_ingreso}
                        onChange={(e) => setVisibleCols({ ...visibleCols, ultimo_ingreso: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Último Ingreso
                    </label>
                    
                    {/* Separador - Campos de Control */}
                    <div className="border-t border-gray-200 my-2 pt-2">
                      <p className="text-xs text-gray-400 mb-2">📦 Control</p>
                    </div>
                    
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.sku}
                        onChange={(e) => setVisibleCols({ ...visibleCols, sku: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      SKU
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.marca}
                        onChange={(e) => setVisibleCols({ ...visibleCols, marca: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Marca
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.unidad_medida}
                        onChange={(e) => setVisibleCols({ ...visibleCols, unidad_medida: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Unidad de Medida
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.proveedor}
                        onChange={(e) => setVisibleCols({ ...visibleCols, proveedor: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Proveedor Principal
                    </label>
                    <label className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={visibleCols.ubicacion}
                        onChange={(e) => setVisibleCols({ ...visibleCols, ubicacion: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Ubicación Bodega
                    </label>
                    
                    <div className="border-t border-gray-200 my-2 pt-2"></div>
                    
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

            {/* DataTable con TanStack */}
            <DataTable
              columns={tableColumns}
              data={productosPaginados}
              loading={false}
              emptyIcon={FaBox}
              emptyTitle="Sin productos"
              emptyDescription="No hay productos que coincidan con la búsqueda"
              enableSorting={true}
              getRowId={(row) => row.producto_id}
            />
          </>
        )}
        
        {productosFiltrados.length > 0 && (
          <div className="mt-4 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(productosFiltrados.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              totalItems={productosFiltrados.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>

      
      {confirmDelete && (
        <ConfirmDialog
          isOpen={!!confirmDelete}
          title="Eliminar Producto"
          message="¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer."
          onConfirm={() => confirmarEliminar(false)}
          onCancel={() => setConfirmDelete(null)}
          isLoading={deleting}
        />
      )}

      {/* Modal de opciones cuando el producto tiene ventas/compras */}
      {showDeleteOptions && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[100]" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
          onClick={() => !deleting && setShowDeleteOptions(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md p-6 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationTriangle className="text-3xl text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-800">Producto con Historial</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Este producto tiene <span className="font-semibold text-red-600">ventas o compras registradas</span>. 
              ¿Qué desea hacer?
            </p>

            <div className="space-y-3">
              {/* Opción 1: Desactivar */}
              <button
                onClick={desactivarProducto}
                disabled={deleting}
                className="w-full flex items-center gap-3 p-4 border-2 border-yellow-300 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                <FaBan className="text-2xl text-yellow-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Desactivar producto</p>
                  <p className="text-sm text-gray-500">El producto no aparecerá disponible pero se mantiene el historial</p>
                </div>
              </button>

              {/* Opción 2: Eliminar forzado */}
              <button
                onClick={eliminarForzado}
                disabled={deleting}
                className="w-full flex items-center gap-3 p-4 border-2 border-red-300 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                <FaTrash className="text-2xl text-red-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Eliminar completamente</p>
                  <p className="text-sm text-gray-500">⚠️ Se perderá el historial de ventas y compras</p>
                </div>
              </button>

              {/* Cancelar */}
              <button
                onClick={() => setShowDeleteOptions(null)}
                disabled={deleting}
                className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>

            {deleting && (
              <div className="mt-4 text-center text-gray-500">
                Procesando...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmar descartar cambios */}
      {confirmDiscard && (
        <ConfirmDialog
          isOpen={!!confirmDiscard}
          title="Descartar cambios"
          message="Hay cambios sin guardar. ¿Está seguro de que desea descartar los cambios?"
          onConfirm={handleConfirmDiscard}
          onCancel={() => setConfirmDiscard(false)}
          confirmText="Descartar"
          confirmingText="Descartando..."
          confirmColor="yellow"
        />
      )}

      
      {importModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-50" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
          onClick={handleImportBackdropClick}
        >
          <div 
            className="bg-white rounded-lg sm:rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              onClick={handleCloseImportModal}
              title="Cerrar"
            >
              <FaTimes className="text-base sm:text-lg" />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 lg:mb-8 pr-8">Importación de Productos (CSV/Excel)</h2>

            {!importPreview && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Seleccionar archivo CSV para previsualizar:
                  </label>
                  <div
                    className="w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition cursor-pointer flex items-center justify-center bg-gray-50 hover:bg-blue-50"
                    onClick={() => document.getElementById("csvInput").click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files[0]) {
                        uploadPreview(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <div className="text-center text-gray-500">
                      <div className="text-lg font-semibold">Arrastre o seleccione un archivo</div>
                      <div className="text-sm mt-2">Formatos: CSV</div>
                    </div>
                  </div>
                  <input
                    id="csvInput"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => uploadPreview(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-700 font-semibold flex items-center gap-2">
                        <FaFileExcel className="text-green-600" />
                        Plantilla Excel con instrucciones
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Incluye ejemplos, guía de campos y formato listo para usar
                      </p>
                    </div>
                    <button
                      onClick={descargarPlantillaExcel}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap"
                    >
                      <FaDownload />
                      Descargar Plantilla Excel
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-semibold mb-2">Columnas del archivo CSV:</p>
                  <p className="text-xs text-gray-600 font-mono break-all bg-white p-3 rounded border border-gray-200">
                    codigo_principal,codigo_barras,nombre,descripcion,precio_costo,precio_unitario,stock_actual,categoria_nombre,iva_aplica,ice_aplica,numero_lote,fecha_vencimiento,margen_ganancia,modo_precio
                  </p>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-600">
                      <strong>📌 Obligatorios:</strong> codigo_principal, nombre
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>📋 Opcionales:</strong> codigo_barras, descripcion, precio_costo, numero_lote, fecha_vencimiento
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>🔢 Valores:</strong> iva_aplica/ice_aplica = 0 o 1 | modo_precio = "automatico" o "manual" | margen_ganancia = número (ej: 30)
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>📅 Formato fecha:</strong> YYYY-MM-DD (ej: 2027-12-31)
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-xs text-purple-700">
                    <strong>🏷️ Lotes:</strong> Si incluyes stock_actual y numero_lote, se creará automáticamente el lote con la fecha de vencimiento indicada.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-xs text-gray-700">
                    <strong>💡 Consejo:</strong> Los productos se actualizarán si el código_principal ya existe, o se crearán si es nuevo.
                  </p>
                </div>

                {importUploading && (
                  <div className="text-center py-4">
                    <p className="text-gray-600">Cargando archivo...</p>
                  </div>
                )}
              </div>
            )}

            {importPreview && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Se detectaron <span className="font-bold text-blue-600">{importPreview.count}</span> productos para importar:
                  </p>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0">
                        <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
                          <th className="px-3 py-2 border-r">Código</th>
                          <th className="px-3 py-2 border-r">Nombre</th>
                          <th className="px-3 py-2 border-r">Categoría</th>
                          <th className="px-3 py-2 border-r">Stock</th>
                          <th className="px-3 py-2 border-r">Lote</th>
                          <th className="px-3 py-2 border-r">Vence</th>
                          <th className="px-3 py-2 border-r">Costo</th>
                          <th className="px-3 py-2 border-r">Venta</th>
                          <th className="px-3 py-2 border-r">Margen</th>
                          <th className="px-3 py-2 border-r">Modo</th>
                          <th className="px-3 py-2 border-r">IVA</th>
                          <th className="px-3 py-2">ICE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.preview.map((r, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-3 py-2 border-r text-xs font-medium">{r.codigo_principal || "-"}</td>
                            <td className="px-3 py-2 border-r text-xs max-w-[150px] truncate" title={r.nombre}>{r.nombre || "-"}</td>
                            <td className="px-3 py-2 border-r text-xs">{r.categoria_nombre || "-"}</td>
                            <td className="px-3 py-2 border-r text-xs text-center">{r.stock_actual || "0"}</td>
                            <td className="px-3 py-2 border-r text-xs text-center">
                              {r.numero_lote ? (
                                <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px]">{r.numero_lote}</span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">Auto</span>
                              )}
                            </td>
                            <td className="px-3 py-2 border-r text-xs text-center">{r.fecha_vencimiento || "-"}</td>
                            <td className="px-3 py-2 border-r text-xs">${r.precio_costo || "0.00"}</td>
                            <td className="px-3 py-2 border-r text-xs">${r.precio_unitario || "0.00"}</td>
                            <td className="px-3 py-2 border-r text-xs text-center">{r.margen_ganancia || "30"}%</td>
                            <td className="px-3 py-2 border-r text-xs text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${r.modo_precio === 'manual' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                {r.modo_precio === 'manual' ? '🔒' : '🔄'}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-r text-xs text-center">{r.iva_aplica ? "✓" : "✗"}</td>
                            <td className="px-3 py-2 text-xs text-center">{r.ice_aplica ? "✓" : "✗"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={confirmImport}
                    disabled={importUploading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {importUploading ? "Importando..." : "Confirmar Importación"}
                  </button>
                  <button
                    onClick={handleCloseImportModal}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-50" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
          onClick={handleBackdropClick}
        >
          <div
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className="bg-white rounded-lg sm:rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              onClick={handleCloseModal}
              title="Cerrar"
            >
              <FaTimes className="text-base sm:text-lg" />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 lg:mb-8 pr-8">
              {editing ? "Editar Producto" : "Nuevo Producto"}
            </h2>

            {/* PREVIEW DE IMAGEN */}
            <div
              className={`w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mx-auto mb-4 sm:mb-6 lg:mb-8 rounded-lg sm:rounded-xl border-2 flex items-center justify-center cursor-pointer transition overflow-hidden ${
                dragActive
                  ? "bg-blue-50 border-blue-400"
                  : "bg-gray-100 border-gray-300 border-dashed hover:bg-gray-200 hover:border-blue-400"
              }`}
              onClick={() => document.getElementById("inputFile").click()}
            >
              {preview ? (
                <img
                  src={preview}
                  className="w-full h-full object-cover"
                  onError={() => setPreview(null)}
                />
              ) : (
                <div className="text-center text-gray-400 px-4">
                  <FaCloudUploadAlt className="text-4xl sm:text-5xl mx-auto mb-2 text-gray-300" />
                  <div className="text-xs sm:text-sm font-medium">Clic o arrastra imagen</div>
                  <div className="text-xs text-gray-400 mt-1">PNG, JPG hasta 4MB</div>
                </div>
              )}
            </div>

            <input
              id="inputFile"
              type="file"
              name="imagen"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
              onChange={handleChange}
            />

            {/* FORM */}
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Código Principal</label>
                  <input
                    name="codigo_principal"
                    placeholder="Código único del producto"
                    maxLength={PRODUCT_LIMITS.codigo_principal.max}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                    onChange={handleChange}
                    value={form.codigo_principal}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                  <input
                    name="codigo_barras"
                    placeholder="Código de barras (opcional)"
                    maxLength={PRODUCT_LIMITS.codigo_barras.max}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                    onChange={handleChange}
                    value={form.codigo_barras}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    name="nombre"
                    placeholder="Nombre del producto"
                    maxLength={PRODUCT_LIMITS.nombre.max}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                    onChange={handleChange}
                    value={form.nombre}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Precio de Costo</label>
                  <input
                    name="precio_costo"
                    placeholder="0.00"
                    type="number"
                    step={PRODUCT_LIMITS.precio_costo.step}
                    min={PRODUCT_LIMITS.precio_costo.min}
                    max={PRODUCT_LIMITS.precio_costo.max}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                    onChange={handleChange}
                    value={form.precio_costo}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Precio de Venta</label>
                  <input
                    name="precio_unitario"
                    placeholder="0.00"
                    type="number"
                    step={PRODUCT_LIMITS.precio_unitario.step}
                    min={PRODUCT_LIMITS.precio_unitario.min}
                    max={PRODUCT_LIMITS.precio_unitario.max}
                    className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base ${
                      form.modo_precio === "automatico" ? "bg-green-50 border-green-300" : ""
                    }`}
                    onChange={handleChange}
                    value={form.precio_unitario}
                    readOnly={form.modo_precio === "automatico"}
                    title={form.modo_precio === "automatico" ? "Calculado automáticamente" : "Ingrese precio manualmente"}
                  />
                  {form.modo_precio === "automatico" && (
                    <p className="text-xs text-green-600 mt-1">✓ Calculado automáticamente</p>
                  )}
                </div>
              </div>

              {/* SECCIÓN: CONFIGURACIÓN DE PRECIOS */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  💰 Configuración de Precios
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Margen de ganancia */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Margen de Ganancia (%)</label>
                    <input
                      name="margen_ganancia"
                      placeholder="30"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1000"
                      className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm sm:text-base"
                      onChange={handleChange}
                      value={form.margen_ganancia}
                    />
                  </div>

                  {/* Modo de precio */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Modo de Precio</label>
                    <div className="space-y-2 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="modo_precio"
                          value="automatico"
                          checked={form.modo_precio === "automatico"}
                          onChange={handleChange}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm">Automático <span className="text-gray-400">(recalcula precio)</span></span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="modo_precio"
                          value="manual"
                          checked={form.modo_precio === "manual"}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Manual <span className="text-gray-400">(precio fijo)</span></span>
                      </label>
                    </div>
                  </div>

                  {/* Precio sugerido (solo lectura) */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Precio Sugerido</label>
                    <div className="w-full px-3 sm:px-4 py-2 border rounded-lg bg-gray-50 text-gray-600 text-sm sm:text-base">
                      ${calcularPrecioSugerido()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Costo + {form.margen_ganancia || 0}% margen</p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: STOCK Y LOTES */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  📦 Stock e Inventario
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                  <input
                    name="stock_actual"
                    placeholder="0"
                    type="number"
                    min={PRODUCT_LIMITS.stock_actual.min}
                    max={PRODUCT_LIMITS.stock_actual.max}
                    disabled={editing ? true : false}
                    className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base ${
                      editing ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                    }`}
                    onChange={handleChange}
                    value={form.stock_actual}
                    title={editing ? "El stock solo se modifica desde Ingresar/Deshechar" : ""}
                  />
                  {editing && <p className="text-xs text-gray-500 mt-1">Los cambios de stock se realizan desde Ingresar/Deshechar</p>}
                </div>

                {/* Campos de Lote - Solo visible al crear y si hay stock */}
                {!editing && (
                  <>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Número de Lote {parseInt(form.stock_actual) > 0 && <span className="text-purple-600">(opcional)</span>}
                      </label>
                      <input
                        name="numero_lote"
                        placeholder="Ej: Lote 1, Lote A..."
                        type="text"
                        maxLength={50}
                        disabled={!form.stock_actual || parseInt(form.stock_actual) <= 0}
                        className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm sm:text-base ${
                          !form.stock_actual || parseInt(form.stock_actual) <= 0 ? "bg-gray-100 text-gray-400" : ""
                        }`}
                        onChange={handleChange}
                        value={form.numero_lote}
                        title={!form.stock_actual || parseInt(form.stock_actual) <= 0 ? "Ingrese stock para habilitar" : ""}
                      />
                      {parseInt(form.stock_actual) > 0 && (
                        <p className="text-xs text-gray-500 mt-1">Si lo deja vacío, se generará automáticamente</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Fecha de Vencimiento {parseInt(form.stock_actual) > 0 && <span className="text-red-600">*</span>}
                      </label>
                      <input
                        name="fecha_vencimiento"
                        type="date"
                        required={parseInt(form.stock_actual) > 0}
                        disabled={!form.stock_actual || parseInt(form.stock_actual) <= 0}
                        className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm sm:text-base ${
                          !form.stock_actual || parseInt(form.stock_actual) <= 0 ? "bg-gray-100 text-gray-400" : 
                          !form.fecha_vencimiento && parseInt(form.stock_actual) > 0 ? "border-red-300 bg-red-50" : ""
                        }`}
                        onChange={handleChange}
                        value={form.fecha_vencimiento}
                        min={new Date().toISOString().split('T')[0]}
                        title={!form.stock_actual || parseInt(form.stock_actual) <= 0 ? "Ingrese stock para habilitar" : ""}
                      />
                      {parseInt(form.stock_actual) > 0 && (
                        <p className="text-xs text-red-500 mt-1">⚠️ Obligatorio - Fecha de caducidad del producto</p>
                      )}
                    </div>
                  </>
                )}
                </div>
              </div>

              {/* SECCIÓN: CATEGORÍA Y CLASIFICACIÓN */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  🏷️ Clasificación
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    name="categoria_id"
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                    onChange={handleChange}
                    value={form.categoria_id}
                  >
                    <option value="">Seleccione categoría (opcional)</option>
                    {categorias.map((c) => (
                      <option key={c.categoria_id} value={c.categoria_id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                </div>
              </div>

              {/* SECCIÓN DE IDENTIFICACIÓN Y CONTROL */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  📦 Identificación y Control
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Unidad de medida */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
                    <select
                      name="unidad_medida"
                      className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                      onChange={handleChange}
                      value={form.unidad_medida}
                    >
                      <option value="unidad">Unidad</option>
                      <option value="kg">Kilogramo (Kg)</option>
                      <option value="lb">Libra (Lb)</option>
                      <option value="caja">Caja</option>
                      <option value="paquete">Paquete</option>
                      <option value="litro">Litro</option>
                      <option value="metro">Metro</option>
                      <option value="docena">Docena</option>
                    </select>
                  </div>

                  {/* Marca */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Marca</label>
                    <input
                      name="marca"
                      placeholder="Ej: Sony, Samsung..."
                      type="text"
                      maxLength={100}
                      className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                      onChange={handleChange}
                      value={form.marca}
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">SKU (Código Interno)</label>
                    <input
                      name="sku"
                      placeholder="Ej: PROD-001"
                      type="text"
                      maxLength={50}
                      className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                      onChange={handleChange}
                      value={form.sku}
                    />
                  </div>

                  {/* Proveedor Principal */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Proveedor Principal</label>
                    <select
                      name="proveedor_principal_id"
                      className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                      onChange={handleChange}
                      value={form.proveedor_principal_id}
                    >
                      <option value="">Seleccione proveedor (opcional)</option>
                      {proveedores.map((prov) => (
                        <option key={prov.proveedor_id} value={prov.proveedor_id}>
                          {prov.razon_social || prov.nombre_comercial}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ubicación en bodega */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Ubicación en Bodega</label>
                    <input
                      name="ubicacion_bodega"
                      placeholder="Ej: Pasillo 3 – Estante B"
                      type="text"
                      maxLength={100}
                      className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                      onChange={handleChange}
                      value={form.ubicacion_bodega}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  placeholder="Descripción del producto"
                  maxLength={PRODUCT_LIMITS.descripcion.max}
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                  rows="3"
                  onChange={handleChange}
                  value={form.descripcion}
                />
              </div>

              {/* CHECKBOXES MEJORADOS CON PORCENTAJES */}
              <div className="border-t pt-4 space-y-4">
                {/* IVA */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="iva_aplica"
                      id="iva_aplica"
                      checked={form.iva_aplica === 1}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-3 text-gray-700 font-medium">Aplica IVA</span>
                  </div>
                  {form.iva_aplica === 1 && (
                    <div className="ml-8 flex items-center gap-2">
                      <label className="text-sm text-gray-600">Porcentaje IVA:</label>
                      <input
                        type="number"
                        name="iva_porcentaje"
                        value={form.iva_porcentaje}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        max="100"
                        className="w-24 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  )}
                </div>

                {/* ICE */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="ice_aplica"
                      id="ice_aplica"
                      checked={form.ice_aplica === 1}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-3 text-gray-700 font-medium">Aplica ICE</span>
                  </div>
                  {form.ice_aplica === 1 && (
                    <div className="ml-8 flex items-center gap-2">
                      <label className="text-sm text-gray-600">Porcentaje ICE:</label>
                      <input
                        type="number"
                        name="ice_porcentaje"
                        value={form.ice_porcentaje}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        max="100"
                        className="w-24 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  )}
                </div>

                {/* PREVIEW DEL PRECIO FINAL - ESTILO FACTURA PROFESIONAL */}
                {form.precio_unitario && (form.iva_aplica === 1 || form.ice_aplica === 1) && (
                  <div className="mt-4 bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3">
                      <h4 className="text-white font-bold text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        DESGLOSE DE PRECIO
                      </h4>
                    </div>
                    
                    {/* Body */}
                    <div className="p-4">
                      {/* Subtotal */}
                      <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 text-xs font-bold">$</span>
                          </div>
                          <span className="text-gray-600 font-medium">Subtotal (Precio Base)</span>
                        </div>
                        <span className="font-semibold text-gray-800 text-lg">${calcularPrecioFinal().precioBase}</span>
                      </div>

                      {/* IVA */}
                      {form.iva_aplica === 1 && (
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-bold">IVA</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-blue-700 font-medium">IVA</span>
                              <span className="text-xs text-gray-400">{calcularPrecioFinal().ivaPorcentaje}% del subtotal</span>
                            </div>
                          </div>
                          <span className="font-semibold text-blue-600 text-lg">+ ${calcularPrecioFinal().ivaValor}</span>
                        </div>
                      )}

                      {/* ICE */}
                      {form.ice_aplica === 1 && (
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 text-xs font-bold">ICE</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-purple-700 font-medium">ICE</span>
                              <span className="text-xs text-gray-400">{calcularPrecioFinal().icePorcentaje}% del subtotal</span>
                            </div>
                          </div>
                          <span className="font-semibold text-purple-600 text-lg">+ ${calcularPrecioFinal().iceValor}</span>
                        </div>
                      )}

                      {/* Total */}
                      <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 -mx-4 -mb-4 px-4 py-4 border-t-2 border-green-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-green-800 font-bold text-lg">PRECIO FINAL</span>
                              <span className="text-xs text-green-600">PVP con impuestos incluidos</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-green-600 text-2xl">${calcularPrecioFinal().precioFinal}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BOTONES */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 lg:mt-8">
              <button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 sm:py-3 rounded-lg font-semibold transition disabled:opacity-50 text-sm sm:text-base cursor-pointer"
                onClick={guardarProducto}
              >
                {editing ? "Actualizar Producto" : "Guardar Producto"}
              </button>

              <button
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold transition text-sm sm:text-base cursor-pointer"
                onClick={handleCloseModal}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
