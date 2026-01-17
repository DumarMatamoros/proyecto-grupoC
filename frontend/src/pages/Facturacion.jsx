import { useState, useEffect, useMemo, useRef } from "react";
import {
  FaPlus,
  FaSearch,
  FaTimes,
  FaShoppingCart,
  FaFileInvoiceDollar,
  FaUser,
  FaDollarSign,
  FaTrash,
  FaBoxOpen,
  FaBarcode,
  FaMoneyBillWave,
  FaCreditCard,
  FaUniversity,
  FaReceipt,
  FaWallet,
  FaChevronLeft,
  FaChevronRight,
  FaExpand,
  FaCompress,
  FaFileAlt,
  FaTags,
} from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import PaymentModal from "../components/PaymentModal";
import PrintModal from "../components/PrintModal";
import api from "../services/api";
import {
  createFactura,
  getIVA,
  validarDocumento,
  formatCurrency,
  FORMAS_PAGO,
  CONSUMIDOR_FINAL_CEDULA,
  CONSUMIDOR_FINAL_NOMBRE,
} from "../services/facturaService";
import useToast from "../hooks/useToast";
import { getErrorMessage } from "../utils/errorTranslator";

export default function Facturacion() {
  const toast = useToast();

  // Estados principales
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ivaConfig, setIvaConfig] = useState(15);
  const [loading, setLoading] = useState(true);

  // Estados del modal de nueva factura
  const [modalNuevo, setModalNuevo] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado del modal de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Estado del modal de impresión
  const [printModal, setPrintModal] = useState({
    isOpen: false,
    documentUrl: "",
    title: "",
    size: "ticket",
  });

  // Estado del tipo de documento (factura o nota_venta)
  const [tipoDocumento, setTipoDocumento] = useState("factura");

  // Estado del filtro de categoría
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");

  // Modo pantalla completa
  const [fullscreen, setFullscreen] = useState(false);

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
    try {
      const [productosRes, ivaRes, categoriasRes] = await Promise.all([
        api.get("/productos"),
        getIVA(),
        api.get("/categorias"),
      ]);
      setProductos(productosRes.data);
      setIvaConfig(ivaRes);
      setCategorias(categoriasRes.data?.data || categoriasRes.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Resetear paginación de productos cuando cambia la búsqueda
  useEffect(() => {
    setPaginaProductosPOS(1);
  }, [busquedaProducto]);

  // Resetear paginación cuando cambia la categoría
  useEffect(() => {
    setPaginaProductosPOS(1);
  }, [categoriaFiltro]);

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
    setTipoDocumento("factura");
    setShowPaymentModal(false);
  };

  // Crear factura
  const handleCrearFactura = async (accion = "imprimir") => {
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
        tipo_documento: tipoDocumento,
        items: carrito.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento: item.descuento || 0,
        })),
      };

      const response = await createFactura(data);
      
      toast.success("Venta completada exitosamente");

      // Si el usuario eligió imprimir, abrir modal de impresión
      if (accion?.imprimir && response.factura) {
        setPrintModal({
          isOpen: true,
          documentUrl: `/sales/${response.factura.factura_id}/ticket`,
          title: `Ticket - ${response.factura.numero_factura}`,
          size: "ticket",
        });
      }

      limpiarFormulario();
      cargarDatos();
      setModalNuevo(false);
      setShowPaymentModal(false);
    } catch (error) {
      console.error("Error al crear factura:", error);
      console.error("Response data:", error.response?.data);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Abrir modal de pago
  const handleAbrirPago = () => {
    // Validaciones previas
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

    setShowPaymentModal(true);
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
    <div 
      className={`flex flex-col lg:flex-row gap-0 bg-gray-900 rounded-xl overflow-hidden shadow-2xl ${
        fullscreen ? "h-[calc(100vh-100px)]" : "h-[calc(100vh-180px)]"
      }`} 
      style={{ minHeight: "400px" }}
    >
      
      {/* Panel izquierdo - Carrito y Checkout */}
      <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col bg-gray-800 overflow-hidden">
        
        {/* Header del carrito */}
        <div className="flex-shrink-0 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaShoppingCart className="text-lg text-white" />
            <span className="font-bold text-white text-base">Venta Actual</span>
          </div>
          <span className="text-xs text-blue-200">{carrito.length} item(s)</span>
        </div>

        {/* Botón limpiar carrito */}
        {carrito.length > 0 && (
          <div className="flex-shrink-0 px-2 py-1 bg-gray-100 border-b flex justify-end">
            <button
              onClick={() => setCarrito([])}
              className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FaTrash className="text-xs" /> Vaciar
            </button>
          </div>
        )}

        {/* Lista de items del carrito */}
        <div className="flex-1 overflow-y-auto bg-white min-h-0">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-6">
              <FaShoppingCart className="text-4xl mb-2 text-gray-300" />
              <p className="text-xs">No hay productos</p>
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
        <div className="flex-shrink-0 bg-gray-100 px-2 py-1.5 border-t">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <FaUser className="text-gray-500 text-xs" /> Cliente
              {buscandoCliente && (
                <span className="text-xs text-blue-500 animate-pulse">...</span>
              )}
              {clienteEncontrado && !formCliente.esConsumidorFinal && (
                <span className="text-xs text-green-600">✓</span>
              )}
            </span>
            <button
              onClick={toggleConsumidorFinal}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors font-medium cursor-pointer ${
                formCliente.esConsumidorFinal
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-600 hover:bg-gray-400"
              }`}
            >
              {formCliente.esConsumidorFinal ? "✓ C. Final" : "C. Final"}
            </button>
          </div>
          
          {/* Campos de identificación y nombre */}
          <div className="flex gap-1">
            <div className="flex-1 relative">
              <input
                type="text"
                value={formCliente.cedula_cliente}
                onChange={(e) => setFormCliente({ ...formCliente, cedula_cliente: e.target.value })}
                disabled={formCliente.esConsumidorFinal}
                className={`w-full text-xs border rounded px-2 py-1.5 ${
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
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <input
              type="text"
              value={formCliente.nombre_cliente}
              onChange={(e) => setFormCliente({ ...formCliente, nombre_cliente: e.target.value })}
              disabled={formCliente.esConsumidorFinal || clienteEncontrado}
              className={`flex-1 text-xs border rounded px-2 py-1.5 ${
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
              className="mt-1 w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-1.5 rounded font-medium transition cursor-pointer flex items-center justify-center gap-1"
            >
              <FaPlus className="text-xs" />
              Crear cliente
            </button>
          )}
        </div>

        {/* Formas de pago */}
        <div className="flex-shrink-0 bg-gray-200 px-2 py-1.5">
          <div className="flex gap-1">
            {Object.entries(FORMAS_PAGO).map(([key, label]) => {
              const Icon = iconosFormaPago[key] || FaMoneyBillWave;
              return (
                <button
                  key={key}
                  onClick={() => setFormaPago(key)}
                  className={`flex-1 p-1.5 rounded transition-all cursor-pointer ${
                    formaPago === key
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                  title={label}
                >
                  <Icon className="mx-auto text-sm" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de tipo de documento */}
        <div className="flex-shrink-0 bg-gray-100 px-2 py-1.5 border-t">
          <div className="flex gap-1">
            <button
              onClick={() => setTipoDocumento("factura")}
              className={`flex-1 py-1.5 px-2 rounded font-medium text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                tipoDocumento === "factura"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <FaFileInvoiceDollar className={`text-xs ${tipoDocumento === "factura" ? "text-white" : "text-blue-500"}`} />
              Factura
            </button>
            <button
              onClick={() => setTipoDocumento("nota_venta")}
              className={`flex-1 py-1.5 px-2 rounded font-medium text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                tipoDocumento === "nota_venta"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <FaFileAlt className={`text-xs ${tipoDocumento === "nota_venta" ? "text-white" : "text-purple-500"}`} />
              Nota Venta
            </button>
          </div>
        </div>

        {/* Totales y botón de cobro */}
        <div className="flex-shrink-0 bg-gray-900 px-2 py-2 text-white">
          <div className="flex justify-between items-center mb-1.5">
            <div className="text-xs space-y-0.5">
              <div className="flex gap-2">
                <span className="text-gray-400">Subtotal:</span>
                <span>{formatCurrency(totalesCarrito.subtotal)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400">IVA:</span>
                <span className="text-green-400">{formatCurrency(totalesCarrito.totalIva)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">TOTAL</div>
              <div className="text-xl font-bold text-green-400">{formatCurrency(totalesCarrito.total)}</div>
            </div>
          </div>
          
          <button
            onClick={handleAbrirPago}
            disabled={saving || carrito.length === 0}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
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
      <div className="flex-1 flex flex-col bg-gray-100 min-w-0 overflow-hidden">
        
        {/* Header del catálogo */}
        <div className="flex-shrink-0 px-3 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaBoxOpen className="text-lg text-white" />
            <span className="font-bold text-white text-base">Productos</span>
          </div>
          <span className="text-xs text-cyan-200">
            {productos.filter(p => p.stock_actual > 0).length} disponibles
          </span>
        </div>

        {/* Barra de búsqueda - Optimizada para lector de códigos de barras */}
        <div className="flex-shrink-0 px-2 py-1.5 bg-white border-b flex items-center gap-2">
          <div className="relative flex-1">
            <FaBarcode className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              ref={inputBusquedaRef}
              type="text"
              value={busquedaProducto}
              onChange={(e) => setBusquedaProducto(e.target.value)}
              onKeyDown={handleBusquedaKeyDown}
              placeholder="Escanear código o buscar..."
              className="w-full pl-7 pr-6 py-1.5 border border-gray-300 rounded text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition-all"
              autoComplete="off"
            />
            {busquedaProducto && (
              <button
                onClick={() => {
                  setBusquedaProducto("");
                  inputBusquedaRef.current?.focus();
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">↵</span>
        </div>

        {/* Filtros por Categoría */}
        <div className="flex-shrink-0 px-2 py-1 bg-white border-b overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            <button
              onClick={() => setCategoriaFiltro("todas")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                categoriaFiltro === "todas"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FaTags className="inline-block mr-1 text-xs" />
              Todas
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.categoria_id || cat.id}
                onClick={() => setCategoriaFiltro(cat.categoria_id || cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  categoriaFiltro === (cat.categoria_id || cat.id)
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 p-2 overflow-y-auto min-h-0">
          {(() => {
            // Filtrar por stock y por búsqueda en tiempo real
            let productosDisponibles = productos.filter(p => p.stock_actual > 0);
            
            // Aplicar filtro de categoría
            if (categoriaFiltro !== "todas") {
              productosDisponibles = productosDisponibles.filter(p => 
                p.categoria_id === categoriaFiltro || 
                p.categoria?.categoria_id === categoriaFiltro
              );
            }
            
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
                  <FaBoxOpen className="text-4xl mb-2" />
                  <p className="text-sm">No hay productos disponibles</p>
                </div>
              );
            }

            if (productosDisponibles.length === 0 && busquedaProducto.trim()) {
              return (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FaSearch className="text-4xl mb-2" />
                  <p className="text-sm">No se encontraron productos</p>
                  <p className="text-xs">para "{busquedaProducto}"</p>
                </div>
              );
            }

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
                  {productosPagina.map((producto) => (
                    <button
                      key={producto.producto_id}
                      onClick={() => agregarAlCarrito(producto.producto_id.toString())}
                      className="bg-white rounded-lg p-2 shadow-sm border border-transparent hover:border-blue-400 hover:shadow-md transition-all text-left group relative overflow-hidden cursor-pointer"
                    >
                      {/* Badge de stock */}
                      <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold text-[10px]">
                        {producto.stock_actual}
                      </div>
                      
                      {/* Imagen del producto */}
                      <div className="mb-1.5 aspect-square">
                        {producto.imagen ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${producto.imagen}`}
                            alt={producto.nombre}
                            className="w-full h-full object-cover rounded bg-gray-100"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center ${producto.imagen ? 'hidden' : ''}`}
                        >
                          <FaBarcode className="text-2xl text-blue-400" />
                        </div>
                      </div>
                      
                      {/* Info del producto */}
                      <p className="font-semibold text-gray-800 text-xs truncate" title={producto.nombre}>
                        {producto.nombre}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {producto.codigo_principal || 'Sin código'}
                      </p>
                      <p className="text-blue-600 font-bold text-sm">
                        {formatCurrency(producto.precio_unitario)}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t">
                    <button
                      onClick={() => setPaginaProductosPOS(p => Math.max(1, p - 1))}
                      disabled={paginaProductosPOS === 1}
                      className="px-2 py-1 rounded bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer text-xs"
                    >
                      <FaChevronLeft className="text-xs" /> Ant
                    </button>
                    <span className="text-xs text-gray-600 font-medium">
                      {paginaProductosPOS}/{totalPaginas}
                    </span>
                    <button
                      onClick={() => setPaginaProductosPOS(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaProductosPOS === totalPaginas}
                      className="px-2 py-1 rounded bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer text-xs"
                    >
                      Sig <FaChevronRight className="text-xs" />
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
          <h1 className="text-xl font-bold text-gray-800">Nueva Venta</h1>
          
          {/* Botón fullscreen */}
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>

      {/* Vista principal - POS */}
      {renderVistaPOS()}

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

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={totalesCarrito.total}
        tipoDocumento={tipoDocumento}
        formatCurrency={formatCurrency}
        loading={saving}
        onConfirm={(opciones) => handleCrearFactura(opciones)}
      />

      {/* Modal de Impresión */}
      <PrintModal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal({ ...printModal, isOpen: false })}
        documentUrl={printModal.documentUrl}
        title={printModal.title}
        size={printModal.size}
      />
    </div>
  );
}
