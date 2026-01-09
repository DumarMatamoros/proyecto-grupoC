import { useState, useEffect, useMemo, useRef } from "react";
import {
  FaPlus,
  FaSearch,
  FaTimes,
  FaShoppingCart,
  FaFileInvoiceDollar,
  FaUser,
  FaEye,
  FaFilter,
  FaDollarSign,
  FaChartLine,
  FaCreditCard,
  FaBan,
  FaTrash,
  FaIdCard,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaMinus,
  FaPercentage,
  FaReceipt,
  FaHistory,
  FaClock,
  FaBoxOpen,
  FaBarcode,
  FaMoneyBillWave,
  FaUniversity,
  FaWallet,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaExpand,
  FaCompress,
} from "react-icons/fa";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import SearchableSelect from "../components/SearchableSelect";
import Pagination from "../components/Pagination";
import api from "../services/api";
import {
  getFacturas,
  getEstadisticas,
  createFactura,
  updateFactura,
  deleteFactura,
  getIVA,
  validarDocumento,
  formatCurrency,
  formatDate,
  formatDateTime,
  FORMAS_PAGO,
  ESTADOS_FACTURA,
  ESTADO_COLORS,
  CONSUMIDOR_FINAL_CEDULA,
  CONSUMIDOR_FINAL_NOMBRE,
} from "../services/facturaService";
import useToast from "../hooks/useToast";
import { translateError } from "../utils/errorTranslator";

export default function Facturacion() {
  const toast = useToast();

  // Estados principales
  const [facturas, setFacturas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [ivaConfig, setIvaConfig] = useState(15);
  const [loading, setLoading] = useState(true);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true);

  // Estados del modal de nueva factura
  const [modalNuevo, setModalNuevo] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados del modal de detalle
  const [modalDetalle, setModalDetalle] = useState(null);

  // Estados de anulación
  const [confirmAnular, setConfirmAnular] = useState(null);
  const [anulando, setAnulando] = useState(false);

  // Estados de eliminación
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Estados de búsqueda y filtros
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Vista: 'pos' o 'lista'
  const [vista, setVista] = useState("pos");

  // Modo pantalla completa
  const [fullscreen, setFullscreen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Paginación de productos en POS
  const [paginaProductosPOS, setPaginaProductosPOS] = useState(1);
  const productosPorPaginaPOS = 10;

  // Formulario de nueva factura
  const [formCliente, setFormCliente] = useState({
    cedula_cliente: "",
    nombre_cliente: "",
    direccion_cliente: "",
    telefono_cliente: "",
    email_cliente: "",
    esConsumidorFinal: false,
  });
  const [documentoValido, setDocumentoValido] = useState(null);
  const [formaPago, setFormaPago] = useState("efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [descuentoGeneral, setDescuentoGeneral] = useState(0);

  // Estados para búsqueda de cliente
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [mostrarFormCrearCliente, setMostrarFormCrearCliente] = useState(false);
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [modalCrearCliente, setModalCrearCliente] = useState(false);

  // Carrito de productos
  const [carrito, setCarrito] = useState([]);

  // Búsqueda de productos (para lector de códigos de barras)
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const inputBusquedaRef = useRef(null);

  // Producto seleccionado para agregar
  const [productoSeleccionado, setProductoSeleccionado] = useState("");

  // Carga inicial de datos
  const cargarDatos = async () => {
    setLoading(true);
    setLoadingEstadisticas(true);
    try {
      const [facturasRes, productosRes, ivaRes] = await Promise.all([
        getFacturas(),
        api.get("/productos"),
        getIVA(),
      ]);
      setFacturas(facturasRes);
      setProductos(productosRes.data);
      setIvaConfig(ivaRes);
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setLoading(false);
    }

    // Cargar estadísticas en paralelo
    try {
      const estadisticasRes = await getEstadisticas();
      setEstadisticas(estadisticasRes);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  const cargarFacturas = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroFechaInicio) params.fecha_inicio = filtroFechaInicio;
      if (filtroFechaFin) params.fecha_fin = filtroFechaFin;
      if (search) params.search = search;

      const facturasRes = await getFacturas(params);
      setFacturas(facturasRes);
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!loading) {
      cargarFacturas();
    }
  }, [filtroEstado, filtroFechaInicio, filtroFechaFin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        cargarFacturas();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Resetear paginación de productos cuando cambia la búsqueda
  useEffect(() => {
    setPaginaProductosPOS(1);
  }, [busquedaProducto]);

  // Validar documento cuando cambia
  useEffect(() => {
    if (formCliente.esConsumidorFinal) {
      setDocumentoValido({ valid: true, type: "consumidor_final", message: "Consumidor Final" });
      setClienteEncontrado(null);
      setMostrarFormCrearCliente(false);
    } else if (formCliente.cedula_cliente) {
      const resultado = validarDocumento(formCliente.cedula_cliente);
      setDocumentoValido(resultado);
      
      // Si el documento es válido, buscar en la base de datos
      if (resultado.valid) {
        buscarClientePorDocumento(formCliente.cedula_cliente);
      } else {
        setClienteEncontrado(null);
        setMostrarFormCrearCliente(false);
      }
    } else {
      setDocumentoValido(null);
      setClienteEncontrado(null);
      setMostrarFormCrearCliente(false);
    }
  }, [formCliente.cedula_cliente, formCliente.esConsumidorFinal]);

  // Buscar cliente por documento en la base de datos
  const buscarClientePorDocumento = async (documento) => {
    if (!documento || documento.length < 10) return;
    
    setBuscandoCliente(true);
    try {
      const res = await api.get(`/clientes/search?q=${documento}`);
      const clientes = res.data?.data || [];
      
      // Buscar coincidencia exacta
      const clienteExacto = clientes.find(c => c.id_number === documento);
      
      if (clienteExacto) {
        setClienteEncontrado(clienteExacto);
        setMostrarFormCrearCliente(false);
        // Auto-completar datos del cliente
        setFormCliente(prev => ({
          ...prev,
          nombre_cliente: clienteExacto.razon_social || "",
          direccion_cliente: clienteExacto.direccion || "",
          telefono_cliente: clienteExacto.telefono || "",
          email_cliente: clienteExacto.email || "",
        }));
        toast.success(`Cliente encontrado: ${clienteExacto.razon_social}`);
      } else {
        setClienteEncontrado(null);
        setMostrarFormCrearCliente(true);
      }
    } catch (error) {
      console.error("Error buscando cliente:", error);
      setClienteEncontrado(null);
      setMostrarFormCrearCliente(true);
    } finally {
      setBuscandoCliente(false);
    }
  };

  // Crear cliente nuevo desde facturación
  const handleCrearClienteRapido = async () => {
    if (!formCliente.cedula_cliente || !formCliente.nombre_cliente) {
      toast.error("Ingrese al menos la identificación y el nombre");
      return;
    }
    
    setCreandoCliente(true);
    try {
      // Determinar tipo de documento
      const tipoDoc = formCliente.cedula_cliente.length === 13 ? "RUC" : "CEDULA";
      
      const nuevoCliente = {
        id_type: tipoDoc,
        id_number: formCliente.cedula_cliente,
        razon_social: formCliente.nombre_cliente,
        direccion: formCliente.direccion_cliente || "Sin dirección",
        telefono: formCliente.telefono_cliente || null,
        email: formCliente.email_cliente || null,
      };
      
      const res = await api.post("/clientes", nuevoCliente);
      const clienteCreado = res.data?.data;
      
      setClienteEncontrado(clienteCreado);
      setMostrarFormCrearCliente(false);
      setModalCrearCliente(false);
      toast.success(`Cliente "${formCliente.nombre_cliente}" creado exitosamente`);
    } catch (error) {
      console.error("Error creando cliente:", error);
      toast.error(error.response?.data?.message || "Error al crear el cliente");
    } finally {
      setCreandoCliente(false);
    }
  };

  // Paginación
  const facturasPaginadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return facturas.slice(start, start + itemsPerPage);
  }, [facturas, currentPage]);

  const totalPages = Math.ceil(facturas.length / itemsPerPage);

  // Opciones de productos para SearchableSelect
  const productosOptions = useMemo(() => {
    return productos
      .filter((p) => p.stock_actual > 0)
      .map((p) => ({
        value: p.producto_id.toString(),
        label: `${p.codigo_principal || ""} - ${p.nombre} (Stock: ${p.stock_actual})`,
        producto: p,
      }));
  }, [productos]);

  // Cálculos del carrito
  const totalesCarrito = useMemo(() => {
    let subtotal = 0;
    let totalIva = 0;

    carrito.forEach((item) => {
      const subtotalItem = item.cantidad * item.precio_unitario - (item.descuento || 0);
      const ivaItem = item.iva_aplica ? subtotalItem * (ivaConfig / 100) : 0;
      subtotal += subtotalItem;
      totalIva += ivaItem;
    });

    const total = subtotal + totalIva - descuentoGeneral;

    return {
      subtotal,
      totalIva,
      descuento: descuentoGeneral,
      total: total > 0 ? total : 0,
    };
  }, [carrito, descuentoGeneral, ivaConfig]);

  // Agregar producto al carrito
  const agregarAlCarrito = (productoId) => {
    if (!productoId) return;

    const producto = productos.find((p) => p.producto_id.toString() === productoId);
    if (!producto) return;

    const existeEnCarrito = carrito.find((item) => item.producto_id === producto.producto_id);

    if (existeEnCarrito) {
      // Verificar stock
      if (existeEnCarrito.cantidad >= producto.stock_actual) {
        toast.warning(`Stock máximo alcanzado para ${producto.nombre}`);
        return;
      }
      setCarrito((prev) =>
        prev.map((item) =>
          item.producto_id === producto.producto_id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCarrito((prev) => [
        ...prev,
        {
          producto_id: producto.producto_id,
          nombre: producto.nombre,
          codigo: producto.codigo_principal || "",
          cantidad: 1,
          precio_unitario: parseFloat(producto.precio_unitario) || 0,
          iva_aplica: producto.iva_aplica !== false,
          descuento: 0,
          stock_disponible: producto.stock_actual,
        },
      ]);
    }

    setProductoSeleccionado("");
    toast.success(`${producto.nombre} agregado al carrito`);
  };

  // Buscar producto por código de barras y agregar al carrito
  const buscarYAgregarProducto = (codigo) => {
    if (!codigo || codigo.trim() === "") return;
    
    const codigoLimpio = codigo.trim().toLowerCase();
    
    // Buscar por código de barras, código principal o nombre exacto
    const producto = productos.find((p) => 
      p.codigo_barras?.toLowerCase() === codigoLimpio ||
      p.codigo_principal?.toLowerCase() === codigoLimpio ||
      p.nombre?.toLowerCase() === codigoLimpio
    );
    
    if (producto) {
      if (producto.stock_actual <= 0) {
        toast.warning(`${producto.nombre} no tiene stock disponible`);
      } else {
        agregarAlCarrito(producto.producto_id.toString());
      }
    } else {
      // Búsqueda parcial si no se encontró exacto
      const productosParciales = productos.filter((p) =>
        p.codigo_barras?.toLowerCase().includes(codigoLimpio) ||
        p.codigo_principal?.toLowerCase().includes(codigoLimpio) ||
        p.nombre?.toLowerCase().includes(codigoLimpio)
      );
      
      if (productosParciales.length === 1 && productosParciales[0].stock_actual > 0) {
        agregarAlCarrito(productosParciales[0].producto_id.toString());
      } else if (productosParciales.length > 1) {
        toast.info(`Se encontraron ${productosParciales.length} productos. Seleccione uno del catálogo.`);
      } else {
        toast.error(`No se encontró producto con código: ${codigo}`);
      }
    }
    
    // Limpiar campo y mantener foco
    setBusquedaProducto("");
    setTimeout(() => {
      inputBusquedaRef.current?.focus();
    }, 50);
  };

  // Manejar tecla Enter en búsqueda
  const handleBusquedaKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarYAgregarProducto(busquedaProducto);
    }
  };

  // Actualizar cantidad en carrito
  const actualizarCantidad = (productoId, nuevaCantidad) => {
    const item = carrito.find((i) => i.producto_id === productoId);
    if (!item) return;

    if (nuevaCantidad < 1) {
      eliminarDelCarrito(productoId);
      return;
    }

    if (nuevaCantidad > item.stock_disponible) {
      toast.warning(`Stock máximo: ${item.stock_disponible}`);
      return;
    }

    setCarrito((prev) =>
      prev.map((i) =>
        i.producto_id === productoId ? { ...i, cantidad: nuevaCantidad } : i
      )
    );
  };

  // Actualizar descuento de item
  const actualizarDescuentoItem = (productoId, descuento) => {
    setCarrito((prev) =>
      prev.map((i) =>
        i.producto_id === productoId ? { ...i, descuento: parseFloat(descuento) || 0 } : i
      )
    );
  };

  // Eliminar del carrito
  const eliminarDelCarrito = (productoId) => {
    setCarrito((prev) => prev.filter((i) => i.producto_id !== productoId));
  };

  // Toggle consumidor final
  const toggleConsumidorFinal = () => {
    if (!formCliente.esConsumidorFinal) {
      setFormCliente({
        cedula_cliente: CONSUMIDOR_FINAL_CEDULA,
        nombre_cliente: CONSUMIDOR_FINAL_NOMBRE,
        direccion_cliente: "",
        telefono_cliente: "",
        email_cliente: "",
        esConsumidorFinal: true,
      });
      setClienteEncontrado(null);
      setMostrarFormCrearCliente(false);
    } else {
      setFormCliente({
        cedula_cliente: "",
        nombre_cliente: "",
        direccion_cliente: "",
        telefono_cliente: "",
        email_cliente: "",
        esConsumidorFinal: false,
      });
      setClienteEncontrado(null);
      setMostrarFormCrearCliente(false);
    }
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setFormCliente({
      cedula_cliente: "",
      nombre_cliente: "",
      direccion_cliente: "",
      telefono_cliente: "",
      email_cliente: "",
      esConsumidorFinal: false,
    });
    setFormaPago("efectivo");
    setObservaciones("");
    setDescuentoGeneral(0);
    setCarrito([]);
    setDocumentoValido(null);
    setClienteEncontrado(null);
    setMostrarFormCrearCliente(false);
  };

  // Crear factura
  const handleCrearFactura = async () => {
    // Validaciones
    if (carrito.length === 0) {
      toast.error("Agregue al menos un producto");
      return;
    }

    if (!formCliente.cedula_cliente) {
      toast.error("Ingrese la cédula/RUC del cliente");
      return;
    }

    if (!documentoValido?.valid) {
      toast.error(documentoValido?.message || "Documento inválido");
      return;
    }

    if (!formCliente.nombre_cliente) {
      toast.error("Ingrese el nombre del cliente");
      return;
    }

    setSaving(true);
    try {
      const data = {
        cedula_cliente: formCliente.cedula_cliente,
        nombre_cliente: formCliente.nombre_cliente,
        direccion_cliente: formCliente.direccion_cliente,
        telefono_cliente: formCliente.telefono_cliente,
        email_cliente: formCliente.email_cliente,
        forma_pago: formaPago,
        observaciones,
        descuento: descuentoGeneral,
        items: carrito.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento: item.descuento || 0,
        })),
      };

      const response = await createFactura(data);
      toast.success("Factura creada exitosamente");

      // Mostrar detalle de la factura creada
      if (response.factura) {
        setModalDetalle(response.factura);
      }

      limpiarFormulario();
      cargarDatos();
      setModalNuevo(false);
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setSaving(false);
    }
  };

  // Anular factura
  const handleAnularFactura = async () => {
    if (!confirmAnular) return;

    setAnulando(true);
    try {
      await updateFactura(confirmAnular.factura_id, { estado: "anulada" });
      toast.success("Factura anulada exitosamente");
      setConfirmAnular(null);
      cargarDatos();
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setAnulando(false);
    }
  };

  // Eliminar factura
  const handleEliminarFactura = async () => {
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await deleteFactura(confirmDelete.factura_id);
      toast.success("Factura eliminada exitosamente");
      setConfirmDelete(null);
      cargarDatos();
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setDeleting(false);
    }
  };

  // Columnas de la tabla
  const columns = useMemo(
    () => [
      {
        accessorKey: "numero_factura",
        header: "N° Factura",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.numero_factura}</span>
        ),
      },
      {
        accessorKey: "fecha_emision",
        header: "Fecha",
        cell: ({ row }) => formatDate(row.original.fecha_emision),
      },
      {
        accessorKey: "cedula_cliente",
        header: "Cliente",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.nombre_cliente}</div>
            <div className="text-xs text-gray-500">{row.original.cedula_cliente}</div>
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-semibold">{formatCurrency(row.original.total)}</span>
        ),
      },
      {
        accessorKey: "forma_pago",
        header: "Pago",
        cell: ({ row }) => FORMAS_PAGO[row.original.forma_pago] || row.original.forma_pago,
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              ESTADO_COLORS[row.original.estado] || "bg-gray-100 text-gray-800"
            }`}
          >
            {ESTADOS_FACTURA[row.original.estado] || row.original.estado}
          </span>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => setModalDetalle(row.original)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
              title="Ver detalle"
            >
              <FaEye />
            </button>
            {row.original.estado === "emitida" && (
              <button
                onClick={() => setConfirmAnular(row.original)}
                className="p-2 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                title="Anular factura"
              >
                <FaBan />
              </button>
            )}
            {row.original.estado === "pendiente" && (
              <button
                onClick={() => setConfirmDelete(row.original)}
                className="p-2 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                title="Eliminar factura"
              >
                <FaTrash />
              </button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  // Renderizar estadísticas
  const renderEstadisticas = () => {
    if (loadingEstadisticas) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      );
    }

    if (!estadisticas) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ventas de Hoy</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(estadisticas.ventas_hoy)}
              </p>
              <p className="text-xs text-gray-400">{estadisticas.facturas_hoy} facturas</p>
            </div>
            <FaDollarSign className="text-3xl text-green-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ventas del Mes</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(estadisticas.ventas_mes)}
              </p>
              <p className="text-xs text-gray-400">{estadisticas.facturas_mes} facturas</p>
            </div>
            <FaChartLine className="text-3xl text-blue-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">IVA Recaudado (Mes)</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(estadisticas.iva_recaudado_mes)}
              </p>
              <p className="text-xs text-gray-400">Tasa: {ivaConfig}%</p>
            </div>
            <FaPercentage className="text-3xl text-purple-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {estadisticas.facturas_pendientes}
              </p>
              <p className="text-xs text-gray-400">Por procesar</p>
            </div>
            <FaClock className="text-3xl text-yellow-200" />
          </div>
        </div>
      </div>
    );
  };

  // Iconos para formas de pago
  const iconosFormaPago = {
    efectivo: FaMoneyBillWave,
    tarjeta: FaCreditCard,
    transferencia: FaUniversity,
    cheque: FaReceipt,
    credito: FaWallet,
  };

  // Renderizar vista POS (Punto de Venta) - Estilo Profesional
  const renderVistaPOS = () => (
    <div className="flex flex-col lg:flex-row gap-0 bg-gray-900 rounded-xl overflow-hidden shadow-2xl" style={{ height: fullscreen ? "calc(100vh - 80px)" : "calc(100vh - 200px)", maxHeight: fullscreen ? "none" : "750px" }}>
      
      {/* Panel izquierdo - Carrito y Checkout */}
      <div className="w-full lg:w-[420px] xl:w-[480px] flex flex-col bg-gray-800">
        
        {/* Header del carrito */}
        <div className="px-4 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaShoppingCart className="text-xl text-white" />
            <span className="font-bold text-white text-lg">Venta Actual</span>
          </div>
          <span className="text-sm text-blue-200">{carrito.length} producto(s)</span>
        </div>

        {/* Botón limpiar carrito */}
        {carrito.length > 0 && (
          <div className="px-3 py-2 bg-gray-100 border-b flex justify-end">
            <button
              onClick={() => setCarrito([])}
              className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FaTrash /> Vaciar carrito
            </button>
          </div>
        )}

        {/* Lista de items del carrito - Estilo lista simple */}
        <div className="flex-1 overflow-y-auto bg-white">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <FaShoppingCart className="text-5xl mb-3 text-gray-300" />
              <p className="text-sm">No hay productos en la venta</p>
              <p className="text-xs text-gray-400 mt-1">Seleccione productos del catálogo</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {carrito.map((item) => (
                <div key={item.producto_id} className="px-3 py-2 hover:bg-blue-50 transition-colors group flex items-center gap-2">
                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => actualizarCantidad(item.producto_id, item.cantidad - 1)}
                      className="w-6 h-6 bg-gray-200 text-gray-600 rounded flex items-center justify-center hover:bg-gray-300 text-xs font-bold cursor-pointer"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold text-gray-800 text-sm">{item.cantidad}</span>
                    <button
                      onClick={() => actualizarCantidad(item.producto_id, item.cantidad + 1)}
                      className="w-6 h-6 bg-blue-500 text-white rounded flex items-center justify-center hover:bg-blue-600 text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  {/* Info del producto */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{item.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.precio_unitario)}
                      {item.iva_aplica && <span className="text-green-600 ml-1">+IVA</span>}
                    </p>
                  </div>
                  {/* Precio */}
                  <span className="font-bold text-blue-600 text-sm whitespace-nowrap">
                    {formatCurrency(item.cantidad * item.precio_unitario)}
                  </span>
                  {/* Botón eliminar */}
                  <button
                    onClick={() => eliminarDelCarrito(item.producto_id)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                    title="Eliminar"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección de cliente - Compacta */}
        <div className="bg-gray-100 px-4 py-3 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FaUser className="text-gray-500" /> Cliente
              {buscandoCliente && (
                <span className="text-xs text-blue-500 animate-pulse">Buscando...</span>
              )}
              {clienteEncontrado && !formCliente.esConsumidorFinal && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  ✓ Registrado
                </span>
              )}
            </span>
            <button
              onClick={toggleConsumidorFinal}
              className={`text-xs px-3 py-1 rounded-full transition-colors font-medium cursor-pointer ${
                formCliente.esConsumidorFinal
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-600 hover:bg-gray-400"
              }`}
            >
              {formCliente.esConsumidorFinal ? "✓ Consumidor Final" : "Consumidor Final"}
            </button>
          </div>
          
          {/* Campos de identificación y nombre */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={formCliente.cedula_cliente}
                onChange={(e) => setFormCliente({ ...formCliente, cedula_cliente: e.target.value })}
                disabled={formCliente.esConsumidorFinal}
                className={`w-full text-sm border rounded-lg px-3 py-2 ${
                  documentoValido
                    ? documentoValido.valid
                      ? clienteEncontrado 
                        ? "border-green-500 bg-green-50" 
                        : "border-yellow-400 bg-yellow-50"
                      : "border-red-400 bg-red-50"
                    : "border-gray-300 bg-white"
                }`}
                placeholder="Cédula / RUC"
                maxLength={13}
              />
              {buscandoCliente && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <input
              type="text"
              value={formCliente.nombre_cliente}
              onChange={(e) => setFormCliente({ ...formCliente, nombre_cliente: e.target.value })}
              disabled={formCliente.esConsumidorFinal || clienteEncontrado}
              className={`flex-1 text-sm border rounded-lg px-3 py-2 ${
                clienteEncontrado && !formCliente.esConsumidorFinal
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 bg-white"
              }`}
              placeholder="Nombre"
            />
          </div>
          
          {/* Mensaje de error de cédula/RUC */}
          {documentoValido && !documentoValido.valid && !formCliente.esConsumidorFinal && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <FaTimes className="text-xs" />
              {documentoValido.message || 'Documento debe tener 10 (cédula) o 13 (RUC) dígitos'}
            </p>
          )}
          
          {/* Botón para abrir modal de creación de cliente */}
          {mostrarFormCrearCliente && documentoValido?.valid && !formCliente.esConsumidorFinal && !clienteEncontrado && (
            <button
              onClick={() => setModalCrearCliente(true)}
              className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-2"
            >
              <FaPlus className="text-xs" />
              Cliente no registrado - Crear nuevo
            </button>
          )}
        </div>

        {/* Formas de pago */}
        <div className="bg-gray-200 px-4 py-2">
          <div className="flex gap-1">
            {Object.entries(FORMAS_PAGO).map(([key, label]) => {
              const Icon = iconosFormaPago[key] || FaMoneyBillWave;
              return (
                <button
                  key={key}
                  onClick={() => setFormaPago(key)}
                  className={`flex-1 p-2 rounded-lg transition-all cursor-pointer ${
                    formaPago === key
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                  title={label}
                >
                  <Icon className="mx-auto text-lg" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Totales y botón de cobro */}
        <div className="bg-gray-900 px-4 py-4 text-white">
          <div className="space-y-1 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal:</span>
              <span>{formatCurrency(totalesCarrito.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">IVA ({ivaConfig}%):</span>
              <span className="text-green-400">{formatCurrency(totalesCarrito.totalIva)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold pt-2 border-t border-gray-700">
              <span>TOTAL:</span>
              <span className="text-green-400">{formatCurrency(totalesCarrito.total)}</span>
            </div>
          </div>
          
          <button
            onClick={handleCrearFactura}
            disabled={saving || carrito.length === 0}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg cursor-pointer"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                Procesando...
              </>
            ) : (
              <>
                <FaDollarSign className="text-xl" />
                COBRAR {formatCurrency(totalesCarrito.total)}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Panel derecho - Catálogo de Productos */}
      <div className="flex-1 flex flex-col bg-gray-100 min-w-0">
        
        {/* Header del catálogo */}
        <div className="px-4 py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaBoxOpen className="text-xl text-white" />
            <span className="font-bold text-white text-lg">Productos</span>
          </div>
          <span className="text-sm text-cyan-200">
            {productos.filter(p => p.stock_actual > 0).length} disponibles
          </span>
        </div>

        {/* Barra de búsqueda - Optimizada para lector de códigos de barras */}
        <div className="p-3 bg-white border-b flex items-center gap-2">
          <div className="relative flex-1">
            <FaBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputBusquedaRef}
              type="text"
              value={busquedaProducto}
              onChange={(e) => setBusquedaProducto(e.target.value)}
              onKeyDown={handleBusquedaKeyDown}
              placeholder="Escanear código o buscar..."
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition-all"
              autoComplete="off"
            />
            {busquedaProducto && (
              <button
                onClick={() => {
                  setBusquedaProducto("");
                  inputBusquedaRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <FaTimes className="text-sm" />
              </button>
            )}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">Enter ↵</span>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 p-3 overflow-y-auto">
          {(() => {
            // Filtrar por stock y por búsqueda en tiempo real
            let productosDisponibles = productos.filter(p => p.stock_actual > 0);
            
            // Aplicar filtro de búsqueda si hay texto
            if (busquedaProducto.trim()) {
              const termino = busquedaProducto.trim().toLowerCase();
              productosDisponibles = productosDisponibles.filter(p =>
                p.codigo_barras?.toLowerCase().includes(termino) ||
                p.codigo_principal?.toLowerCase().includes(termino) ||
                p.nombre?.toLowerCase().includes(termino)
              );
            }
            
            const totalPaginas = Math.ceil(productosDisponibles.length / productosPorPaginaPOS);
            const inicio = (paginaProductosPOS - 1) * productosPorPaginaPOS;
            const productosPagina = productosDisponibles.slice(inicio, inicio + productosPorPaginaPOS);

            if (productos.filter(p => p.stock_actual > 0).length === 0) {
              return (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FaBoxOpen className="text-5xl mb-3" />
                  <p className="text-lg">No hay productos disponibles</p>
                </div>
              );
            }

            if (productosDisponibles.length === 0 && busquedaProducto.trim()) {
              return (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FaSearch className="text-5xl mb-3" />
                  <p className="text-lg">No se encontraron productos</p>
                  <p className="text-sm">para "{busquedaProducto}"</p>
                </div>
              );
            }

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {productosPagina.map((producto) => (
                    <button
                      key={producto.producto_id}
                      onClick={() => agregarAlCarrito(producto.producto_id.toString())}
                      className="bg-white rounded-xl p-3 shadow-sm border-2 border-transparent hover:border-blue-400 hover:shadow-lg transition-all text-left group relative overflow-hidden cursor-pointer"
                    >
                      {/* Badge de stock */}
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {producto.stock_actual}
                      </div>
                      
                      {/* Imagen del producto */}
                      <div className="mb-2 aspect-square">
                        {producto.imagen ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${producto.imagen}`}
                            alt={producto.nombre}
                            className="w-full h-full object-cover rounded-lg bg-gray-100"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center ${producto.imagen ? 'hidden' : ''}`}
                        >
                          <FaBarcode className="text-3xl text-blue-400" />
                        </div>
                      </div>
                      
                      {/* Info del producto */}
                      <p className="font-semibold text-gray-800 text-sm truncate mb-1" title={producto.nombre}>
                        {producto.nombre}
                      </p>
                      <p className="text-xs text-gray-500 truncate mb-1">
                        {producto.codigo_principal || 'Sin código'}
                      </p>
                      <p className="text-blue-600 font-bold text-lg">
                        {formatCurrency(producto.precio_unitario)}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
                    <button
                      onClick={() => setPaginaProductosPOS(p => Math.max(1, p - 1))}
                      disabled={paginaProductosPOS === 1}
                      className="px-4 py-2 rounded-lg bg-white shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      <FaChevronLeft /> Anterior
                    </button>
                    <span className="text-sm text-gray-600 font-medium">
                      Página {paginaProductosPOS} de {totalPaginas}
                    </span>
                    <button
                      onClick={() => setPaginaProductosPOS(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaProductosPOS === totalPaginas}
                      className="px-4 py-2 rounded-lg bg-white shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      Siguiente <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );

  // Renderizar lista de facturas
  const renderListaFacturas = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número, cédula o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border cursor-pointer ${
                showFilters ? "bg-blue-50 border-blue-300" : ""
              }`}
            >
              <FaFilter />
            </button>
          </div>
          <button
            onClick={() => {
              limpiarFormulario();
              setVista("pos");
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 cursor-pointer"
          >
            <FaPlus />
            Nueva Factura
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Todos</option>
                {Object.entries(ESTADOS_FACTURA).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Desde</label>
              <input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : facturas.length === 0 ? (
        <EmptyState
          icon={FaFileInvoiceDollar}
          title="No hay facturas"
          description="Crea tu primera factura desde el punto de venta"
        />
      ) : (
        <>
          <DataTable columns={columns} data={facturasPaginadas} />
          {totalPages > 1 && (
            <div className="p-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  // Modal de detalle de factura
  const renderModalDetalle = () => {
    if (!modalDetalle) return null;

    return (
      <div 
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
        onClick={() => setModalDetalle(null)}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaFileInvoiceDollar className="text-blue-500" />
              Factura {modalDetalle.numero_factura}
            </h2>
            <button
              onClick={() => setModalDetalle(null)}
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
            {/* Estado */}
            <div className="flex justify-between items-center mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  ESTADO_COLORS[modalDetalle.estado] || "bg-gray-100"
                }`}
              >
                {ESTADOS_FACTURA[modalDetalle.estado]}
              </span>
              <span className="text-sm text-gray-500">
                {formatDateTime(modalDetalle.fecha_emision)} - {modalDetalle.hora}
              </span>
            </div>

            {/* Datos del cliente */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Datos del Cliente</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Documento:</span>
                  <span className="ml-2">{modalDetalle.cedula_cliente}</span>
                </div>
                <div>
                  <span className="text-gray-500">Nombre:</span>
                  <span className="ml-2">{modalDetalle.nombre_cliente}</span>
                </div>
                {modalDetalle.direccion_cliente && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Dirección:</span>
                    <span className="ml-2">{modalDetalle.direccion_cliente}</span>
                  </div>
                )}
                {modalDetalle.telefono_cliente && (
                  <div>
                    <span className="text-gray-500">Teléfono:</span>
                    <span className="ml-2">{modalDetalle.telefono_cliente}</span>
                  </div>
                )}
                {modalDetalle.email_cliente && (
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2">{modalDetalle.email_cliente}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles de productos */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Detalle de Productos</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-right">Cant.</th>
                    <th className="px-3 py-2 text-right">P.Unit</th>
                    <th className="px-3 py-2 text-right">IVA</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {modalDetalle.detalles?.map((detalle, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        {detalle.producto?.nombre || `Producto #${detalle.producto_id}`}
                      </td>
                      <td className="px-3 py-2 text-right">{detalle.cantidad}</td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(detalle.precio_unitario)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {detalle.iva_aplica ? `${detalle.porcentaje_iva}%` : "-"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(detalle.total_detalle)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(modalDetalle.total_sin_impuestos)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>IVA:</span>
                  <span>{formatCurrency(modalDetalle.total_iva)}</span>
                </div>
                {modalDetalle.descuento > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento:</span>
                    <span>-{formatCurrency(modalDetalle.descuento)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL:</span>
                  <span className="text-blue-600">{formatCurrency(modalDetalle.total)}</span>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-4 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Forma de pago:</span>
                <span>{FORMAS_PAGO[modalDetalle.forma_pago]}</span>
              </div>
              {modalDetalle.observaciones && (
                <div className="mt-2">
                  <span>Observaciones:</span>
                  <p className="text-gray-700">{modalDetalle.observaciones}</p>
                </div>
              )}
              {modalDetalle.clave_acceso && (
                <div className="mt-2">
                  <span>Clave de acceso:</span>
                  <p className="font-mono text-xs break-all">{modalDetalle.clave_acceso}</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t flex justify-end gap-3">
            <button
              onClick={() => setModalDetalle(null)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Toggle fullscreen - comunicar al layout
  useEffect(() => {
    if (fullscreen) {
      document.body.classList.add('facturacion-fullscreen');
    } else {
      document.body.classList.remove('facturacion-fullscreen');
    }
    return () => document.body.classList.remove('facturacion-fullscreen');
  }, [fullscreen]);

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-gray-100 p-4 overflow-auto" : ""}>
      {/* Header con Tabs estilo navegación */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-800">Facturación</h1>
          
          {/* Tabs de navegación y botón fullscreen */}
          <div className="flex items-center gap-2">
            {vista === "pos" && (
              <button
                onClick={() => setFullscreen(!fullscreen)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  fullscreen
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
                title={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              >
                {fullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            )}
            <div className="bg-gray-100 p-1 rounded-xl inline-flex">
            <button
              onClick={() => setVista("pos")}
              className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                vista === "pos"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <FaShoppingCart className={vista === "pos" ? "text-blue-500" : ""} />
              <span>Punto de Venta</span>
            </button>
            <button
              onClick={() => setVista("lista")}
              className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                vista === "lista"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <FaHistory className={vista === "lista" ? "text-blue-500" : ""} />
              <span>Historial</span>
              {facturas.length > 0 && (
                <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                  {facturas.length}
                </span>
              )}
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas - Solo en vista historial */}
      {vista === "lista" && renderEstadisticas()}

      {/* Vista principal */}
      {vista === "pos" ? renderVistaPOS() : renderListaFacturas()}

      {/* Modal de detalle */}
      {renderModalDetalle()}

      {/* Confirmar anulación */}
      {confirmAnular && (
        <ConfirmDialog
          title="Anular Factura"
          message={`¿Está seguro que desea anular la factura ${confirmAnular?.numero_factura}? Esta acción devolverá los productos al inventario.`}
          confirmText="Anular"
          confirmingText="Anulando..."
          cancelText="Cancelar"
          onConfirm={handleAnularFactura}
          onCancel={() => setConfirmAnular(null)}
          isLoading={anulando}
          confirmColor="red"
        />
      )}

      {/* Confirmar eliminación */}
      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar Factura"
          message={`¿Está seguro que desea eliminar la factura ${confirmDelete?.numero_factura}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          confirmingText="Eliminando..."
          cancelText="Cancelar"
          onConfirm={handleEliminarFactura}
          onCancel={() => setConfirmDelete(null)}
          isLoading={deleting}
          confirmColor="red"
        />
      )}

      {/* Modal de creación de cliente */}
      {modalCrearCliente && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FaUser className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Nuevo Cliente</h2>
                    <p className="text-blue-100 text-xs">Registrar cliente para facturación</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalCrearCliente(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition cursor-pointer"
                >
                  <FaTimes className="text-white" />
                </button>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              {/* Cédula/RUC - Solo lectura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cédula / RUC *
                </label>
                <input
                  type="text"
                  value={formCliente.cedula_cliente}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-mono"
                />
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre / Razón Social *
                </label>
                <input
                  type="text"
                  value={formCliente.nombre_cliente}
                  onChange={(e) => setFormCliente({ ...formCliente, nombre_cliente: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre completo o razón social"
                  autoFocus
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={formCliente.direccion_cliente}
                  onChange={(e) => setFormCliente({ ...formCliente, direccion_cliente: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección completa"
                />
              </div>

              {/* Teléfono y Email en una fila */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formCliente.telefono_cliente}
                    onChange={(e) => setFormCliente({ ...formCliente, telefono_cliente: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0999999999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formCliente.email_cliente}
                    onChange={(e) => setFormCliente({ ...formCliente, email_cliente: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setModalCrearCliente(false)}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await handleCrearClienteRapido();
                  if (!creandoCliente) {
                    setModalCrearCliente(false);
                  }
                }}
                disabled={creandoCliente || !formCliente.nombre_cliente || !formCliente.direccion_cliente}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition cursor-pointer flex items-center gap-2"
              >
                {creandoCliente ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <FaPlus />
                    Crear Cliente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
