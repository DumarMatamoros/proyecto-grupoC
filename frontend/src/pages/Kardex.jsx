import { useState, useEffect } from 'react';
import api from '../services/api';

const Kardex = () => {
    // Estados principales
    const [productos, setProductos] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [kardexDetalle, setKardexDetalle] = useState(null);
    const [lotes, setLotes] = useState([]);
    const [estadisticas, setEstadisticas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [error, setError] = useState(null);

    // Estados de filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroStockBajo, setFiltroStockBajo] = useState(false);
    const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
    const [filtroFechaFin, setFiltroFechaFin] = useState('');

    // Estado para vista
    const [vista, setVista] = useState('lista'); // 'lista', 'detalle', 'estadisticas'

    // Modal de ajuste
    const [showAjusteModal, setShowAjusteModal] = useState(false);
    const [ajusteData, setAjusteData] = useState({
        producto_id: '',
        tipo_ajuste: 'entrada',
        cantidad: '',
        motivo: '',
        observaciones: ''
    });

    // Cargar datos iniciales
    useEffect(() => {
        cargarProductos();
        cargarEstadisticas();
    }, []);

    // Cargar lista de productos con kardex
    const cargarProductos = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (busqueda) params.append('buscar', busqueda);
            if (filtroStockBajo) params.append('stock_bajo', 'true');

            const response = await api.get(`/kardex?${params.toString()}`);
            setProductos(response.data.productos || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar el inventario');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Cargar estadísticas generales
    const cargarEstadisticas = async () => {
        try {
            const response = await api.get('/kardex/estadisticas');
            setEstadisticas(response.data);
        } catch (err) {
            console.error('Error al cargar estadísticas:', err);
        }
    };

    // Ver kardex de un producto específico
    const verKardexProducto = async (productoId) => {
        try {
            setLoadingDetalle(true);
            const params = new URLSearchParams();
            if (filtroFechaInicio) params.append('fecha_inicio', filtroFechaInicio);
            if (filtroFechaFin) params.append('fecha_fin', filtroFechaFin);

            const [kardexRes, lotesRes] = await Promise.all([
                api.get(`/kardex/${productoId}?${params.toString()}`),
                api.get(`/kardex/${productoId}/lotes`)
            ]);

            setKardexDetalle(kardexRes.data);
            setLotes(lotesRes.data.lotes || []);
            setProductoSeleccionado(productoId);
            setVista('detalle');
        } catch (err) {
            setError('Error al cargar el kardex del producto');
            console.error(err);
        } finally {
            setLoadingDetalle(false);
        }
    };

    // Realizar ajuste de inventario
    const realizarAjuste = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post('/kardex/ajuste', ajusteData);
            alert('Ajuste realizado correctamente');
            setShowAjusteModal(false);
            setAjusteData({
                producto_id: '',
                tipo_ajuste: 'entrada',
                cantidad: '',
                motivo: '',
                observaciones: ''
            });
            cargarProductos();
            cargarEstadisticas();
            if (productoSeleccionado) {
                verKardexProducto(productoSeleccionado);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error al realizar el ajuste');
        } finally {
            setLoading(false);
        }
    };

    // Exportar kardex
    const exportarKardex = async (productoId) => {
        try {
            const params = new URLSearchParams();
            if (filtroFechaInicio) params.append('fecha_inicio', filtroFechaInicio);
            if (filtroFechaFin) params.append('fecha_fin', filtroFechaFin);

            const response = await api.get(`/kardex/${productoId}/exportar?${params.toString()}`);
            
            // Crear ventana para imprimir
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Kardex - ${response.data.producto.nombre}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { text-align: center; }
                        .info { margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f4f4f4; }
                        .totales { margin-top: 20px; font-weight: bold; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <h1>${response.data.titulo}</h1>
                    <div class="info">
                        <p><strong>Producto:</strong> ${response.data.producto.codigo} - ${response.data.producto.nombre}</p>
                        <p><strong>Categoría:</strong> ${response.data.producto.categoria}</p>
                        <p><strong>Período:</strong> ${response.data.periodo.desde} al ${response.data.periodo.hasta}</p>
                        <p><strong>Generado:</strong> ${response.data.fecha_generacion}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Documento</th>
                                <th>Referencia</th>
                                <th>Entrada</th>
                                <th>Salida</th>
                                <th>Saldo</th>
                                <th>Costo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${response.data.movimientos.map(m => `
                                <tr>
                                    <td>${m.fecha}</td>
                                    <td>${m.documento}</td>
                                    <td>${m.referencia}</td>
                                    <td>${m.entrada}</td>
                                    <td>${m.salida}</td>
                                    <td>${m.saldo}</td>
                                    <td>${m.costo}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="totales">
                        <p>Total Entradas: ${response.data.totales.entradas}</p>
                        <p>Total Salidas: ${response.data.totales.salidas}</p>
                        <p>Saldo Final: ${response.data.totales.saldo_final}</p>
                    </div>
                    <button class="no-print" onclick="window.print()">Imprimir</button>
                </body>
                </html>
            `);
            printWindow.document.close();
        } catch (err) {
            alert('Error al exportar el kardex');
            console.error(err);
        }
    };

    // Buscar productos
    useEffect(() => {
        const timer = setTimeout(() => {
            cargarProductos();
        }, 500);
        return () => clearTimeout(timer);
    }, [busqueda, filtroStockBajo]);

    // Formatear moneda
    const formatMoney = (value) => {
        return new Intl.NumberFormat('es-EC', {
            style: 'currency',
            currency: 'USD'
        }).format(value || 0);
    };

    // Renderizar vista de lista de productos
    const renderListaProductos = () => (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar producto</label>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Código, nombre..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={filtroStockBajo}
                                onChange={(e) => setFiltroStockBajo(e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Solo stock bajo</span>
                        </label>
                    </div>
                    <div className="flex items-end justify-end">
                        <button
                            onClick={() => setShowAjusteModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            + Ajuste de Inventario
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla de productos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Lotes</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Movimientos</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {productos.map((producto) => (
                            <tr key={producto.producto_id} className={producto.stock_actual <= (producto.stock_minimo || 10) ? 'bg-red-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {producto.codigo_principal}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {producto.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {producto.categoria}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 py-1 text-sm font-semibold rounded ${
                                        producto.stock_actual <= 0 
                                            ? 'bg-red-100 text-red-800' 
                                            : producto.stock_actual <= (producto.stock_minimo || 10) 
                                                ? 'bg-yellow-100 text-yellow-800' 
                                                : 'bg-green-100 text-green-800'
                                    }`}>
                                        {producto.stock_actual}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                    {producto.lotes_activos}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                    {producto.total_movimientos}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <button
                                        onClick={() => verKardexProducto(producto.producto_id)}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                    >
                                        Ver Kardex
                                    </button>
                                    <button
                                        onClick={() => {
                                            setAjusteData({ ...ajusteData, producto_id: producto.producto_id });
                                            setShowAjusteModal(true);
                                        }}
                                        className="text-green-600 hover:text-green-900"
                                    >
                                        Ajustar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {productos.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                        No se encontraron productos
                    </div>
                )}
            </div>
        </div>
    );

    // Renderizar vista de detalle de kardex
    const renderDetalleKardex = () => {
        if (!kardexDetalle) return null;

        return (
            <div className="space-y-4">
                {/* Header */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {kardexDetalle.producto.codigo_principal} - {kardexDetalle.producto.nombre}
                            </h2>
                            <p className="text-sm text-gray-500">Categoría: {kardexDetalle.producto.categoria}</p>
                            <p className="text-lg font-semibold text-blue-600 mt-2">
                                Stock actual: {kardexDetalle.producto.stock_actual}
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => exportarKardex(productoSeleccionado)}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Exportar/Imprimir
                            </button>
                            <button
                                onClick={() => {
                                    setVista('lista');
                                    setProductoSeleccionado(null);
                                    setKardexDetalle(null);
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                Volver
                            </button>
                        </div>
                    </div>

                    {/* Filtros de fecha */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                            <input
                                type="date"
                                value={filtroFechaInicio}
                                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                            <input
                                type="date"
                                value={filtroFechaFin}
                                onChange={(e) => setFiltroFechaFin(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => verKardexProducto(productoSeleccionado)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Filtrar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Resumen */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">Total Entradas</p>
                        <p className="text-2xl font-bold text-green-700">{kardexDetalle.resumen.total_entradas}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600">Total Salidas</p>
                        <p className="text-2xl font-bold text-red-700">{kardexDetalle.resumen.total_salidas}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">Saldo Final</p>
                        <p className="text-2xl font-bold text-blue-700">{kardexDetalle.resumen.saldo_final}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600">Movimientos</p>
                        <p className="text-2xl font-bold text-purple-700">{kardexDetalle.resumen.total_movimientos}</p>
                    </div>
                </div>

                {/* Lotes */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold">Lotes del producto (FIFO)</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Ingreso</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad Inicial</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Disponible</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo Unit.</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {lotes.map((lote) => (
                                    <tr key={lote.lote_id} className={lote.estado === 'vencido' ? 'bg-red-50' : lote.estado === 'proximo_vencer' ? 'bg-yellow-50' : ''}>
                                        <td className="px-4 py-3 text-sm font-medium">#{lote.lote_id}</td>
                                        <td className="px-4 py-3 text-sm">{lote.fecha_ingreso}</td>
                                        <td className="px-4 py-3 text-sm">{lote.fecha_vencimiento || '-'}</td>
                                        <td className="px-4 py-3 text-center text-sm">{lote.cantidad_inicial}</td>
                                        <td className="px-4 py-3 text-center text-sm font-semibold">{lote.cantidad_disponible}</td>
                                        <td className="px-4 py-3 text-right text-sm">{formatMoney(lote.costo_unitario)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                lote.estado === 'vencido' ? 'bg-red-100 text-red-800' :
                                                lote.estado === 'proximo_vencer' ? 'bg-yellow-100 text-yellow-800' :
                                                lote.estado === 'agotado' ? 'bg-gray-100 text-gray-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {lote.estado === 'vencido' ? 'Vencido' :
                                                 lote.estado === 'proximo_vencer' ? `Vence en ${lote.dias_para_vencer} días` :
                                                 lote.estado === 'agotado' ? 'Agotado' : 'Disponible'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {lotes.length === 0 && (
                            <div className="text-center py-4 text-gray-500">No hay lotes registrados</div>
                        )}
                    </div>
                </div>

                {/* Movimientos */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold">Movimientos del Kardex</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Entrada</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Salida</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Saldo</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {kardexDetalle.kardex.map((mov, index) => (
                                    <tr key={mov.movimiento_id || index}>
                                        <td className="px-4 py-3 text-sm">{new Date(mov.fecha).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded ${
                                                mov.tipo_movimiento === 'ENTRADA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {mov.tipo_movimiento}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{mov.tipo_documento} {mov.numero_documento && `#${mov.numero_documento}`}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{mov.referencia || '-'}</td>
                                        <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">{mov.entrada || '-'}</td>
                                        <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">{mov.salida || '-'}</td>
                                        <td className="px-4 py-3 text-center text-sm font-bold">{mov.saldo}</td>
                                        <td className="px-4 py-3 text-right text-sm">{mov.costo_unitario ? formatMoney(mov.costo_unitario) : '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{mov.usuario}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {kardexDetalle.kardex.length === 0 && (
                            <div className="text-center py-4 text-gray-500">No hay movimientos registrados</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Renderizar estadísticas
    const renderEstadisticas = () => {
        if (!estadisticas) return null;

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Estadísticas de Inventario</h2>
                    <button
                        onClick={() => setVista('lista')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                        Volver a Lista
                    </button>
                </div>

                {/* Resumen general */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">Total Productos</p>
                        <p className="text-2xl font-bold text-blue-700">{estadisticas.resumen.total_productos}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-600">Stock Bajo</p>
                        <p className="text-2xl font-bold text-yellow-700">{estadisticas.resumen.productos_stock_bajo}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600">Sin Stock</p>
                        <p className="text-2xl font-bold text-red-700">{estadisticas.resumen.productos_sin_stock}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">Valor Inventario</p>
                        <p className="text-2xl font-bold text-green-700">{formatMoney(estadisticas.resumen.valor_inventario)}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600">Lotes Vencidos</p>
                        <p className="text-2xl font-bold text-orange-700">{estadisticas.resumen.lotes_vencidos}</p>
                    </div>
                </div>

                {/* Movimientos del mes */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Movimientos del Mes</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-gray-600">Entradas</p>
                            <p className="text-xl font-bold text-green-600">{estadisticas.movimientos_mes.entradas}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Salidas</p>
                            <p className="text-xl font-bold text-red-600">{estadisticas.movimientos_mes.salidas}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Total Movimientos</p>
                            <p className="text-xl font-bold text-blue-600">{estadisticas.movimientos_mes.total}</p>
                        </div>
                    </div>
                </div>

                {/* Productos críticos */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-red-600">⚠️ Productos con Stock Crítico</h3>
                    </div>
                    <div className="p-4">
                        {estadisticas.productos_criticos?.length > 0 ? (
                            <ul className="space-y-2">
                                {estadisticas.productos_criticos.map((p) => (
                                    <li key={p.producto_id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                                        <span>{p.codigo_principal} - {p.nombre}</span>
                                        <span className="font-bold text-red-600">Stock: {p.stock_actual}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">No hay productos con stock crítico</p>
                        )}
                    </div>
                </div>

                {/* Lotes próximos a vencer */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-yellow-600">⏰ Lotes Próximos a Vencer (30 días)</h3>
                    </div>
                    <div className="p-4">
                        {estadisticas.lotes_proximos_vencer?.length > 0 ? (
                            <ul className="space-y-2">
                                {estadisticas.lotes_proximos_vencer.map((lote) => (
                                    <li key={lote.lote_id} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                                        <span>Lote #{lote.lote_id} - {lote.producto?.nombre}</span>
                                        <span className="font-bold text-yellow-600">
                                            Vence: {new Date(lote.fecha_vencimiento).toLocaleDateString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">No hay lotes próximos a vencer</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Modal de ajuste de inventario
    const renderAjusteModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Ajuste de Inventario</h3>
                <form onSubmit={realizarAjuste}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                            <select
                                value={ajusteData.producto_id}
                                onChange={(e) => setAjusteData({ ...ajusteData, producto_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            >
                                <option value="">Seleccionar producto</option>
                                {productos.map((p) => (
                                    <option key={p.producto_id} value={p.producto_id}>
                                        {p.codigo_principal} - {p.nombre} (Stock: {p.stock_actual})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ajuste</label>
                            <select
                                value={ajusteData.tipo_ajuste}
                                onChange={(e) => setAjusteData({ ...ajusteData, tipo_ajuste: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="entrada">Entrada (Incrementar stock)</option>
                                <option value="salida">Salida (Decrementar stock)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                            <input
                                type="number"
                                value={ajusteData.cantidad}
                                onChange={(e) => setAjusteData({ ...ajusteData, cantidad: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                            <select
                                value={ajusteData.motivo}
                                onChange={(e) => setAjusteData({ ...ajusteData, motivo: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            >
                                <option value="">Seleccionar motivo</option>
                                <option value="Inventario físico">Inventario físico</option>
                                <option value="Producto dañado">Producto dañado</option>
                                <option value="Producto vencido">Producto vencido</option>
                                <option value="Error de conteo">Error de conteo</option>
                                <option value="Devolución de cliente">Devolución de cliente</option>
                                <option value="Robo/Pérdida">Robo/Pérdida</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                            <textarea
                                value={ajusteData.observaciones}
                                onChange={(e) => setAjusteData({ ...ajusteData, observaciones: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows="3"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setShowAjusteModal(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Guardar Ajuste
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    📦 Control de Inventario - Kardex
                </h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setVista('lista')}
                        className={`px-4 py-2 rounded-md ${vista === 'lista' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Lista
                    </button>
                    <button
                        onClick={() => setVista('estadisticas')}
                        className={`px-4 py-2 rounded-md ${vista === 'estadisticas' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Estadísticas
                    </button>
                </div>
            </div>

            {/* Loading */}
            {(loading || loadingDetalle) && (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Contenido según la vista */}
            {!loading && !loadingDetalle && (
                <>
                    {vista === 'lista' && renderListaProductos()}
                    {vista === 'detalle' && renderDetalleKardex()}
                    {vista === 'estadisticas' && renderEstadisticas()}
                </>
            )}

            {/* Modal de ajuste */}
            {showAjusteModal && renderAjusteModal()}
        </div>
    );
};

export default Kardex;
