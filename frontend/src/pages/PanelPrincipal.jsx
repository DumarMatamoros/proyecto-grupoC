import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBox,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaTruckLoading,
  FaLayerGroup,
  FaChartLine,
  FaCalendarTimes,
  FaBell,
  FaPlus,
  FaReceipt,
} from "react-icons/fa";
import Chart from "chart.js/auto";
import api from "../services/api";

export default function PanelPrincipal() {
  const ventasChartRef = useRef(null);
  const chartInstance = useRef(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    productos: 0,
    stockBajo: 0,
    lotes: 0,
    lotesVencidos: 0,
    proximosVencer: 0,
    ventasHoy: 0,
    ingresosMes: 0,
    movimientosHoy: 0,
  });

  const [ultimosMovimientos, setUltimosMovimientos] = useState([]);
  const [productosStockBajo, setProductosStockBajo] = useState([]);

  // Cargar estadísticas
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [productosRes, lotesRes, movimientosRes] = await Promise.all([
          api.get("/productos"),
          api.get("/lotes/resumen").catch(() => ({ data: {} })),
          api.get("/kardex").catch(() => ({ data: [] })),
        ]);

        const productos = productosRes.data || [];
        const stockBajo = productos.filter(p => p.stock_actual <= 5);

        setProductosStockBajo(stockBajo.slice(0, 5));
        
        // Movimientos de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const movimientosData = Array.isArray(movimientosRes.data) ? movimientosRes.data : [];
        const movimientosHoy = movimientosData.filter(m => m.fecha === hoy);

        setUltimosMovimientos(movimientosData.slice(0, 8));

        setStats({
          productos: productos.length,
          stockBajo: stockBajo.length,
          lotes: lotesRes.data?.total_lotes_activos || 0,
          lotesVencidos: lotesRes.data?.vencidos?.count || 0,
          proximosVencer: lotesRes.data?.proximos_a_vencer?.count || 0,
          ventasHoy: 0,
          ingresosMes: 0,
          movimientosHoy: movimientosHoy.length,
        });
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Gráfico
  useEffect(() => {
    if (!ventasChartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = ventasChartRef.current.getContext("2d");

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        datasets: [
          {
            label: "Entradas",
            data: [12, 19, 8, 15, 12, 8, 5],
            borderColor: "#22c55e",
            backgroundColor: "rgba(34,197,94,0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Salidas",
            data: [8, 12, 5, 10, 8, 6, 3],
            borderColor: "#ef4444",
            backgroundColor: "rgba(239,68,68,0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            display: true,
            position: 'top',
          } 
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      },
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, []);

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Panel de Control
        </h1>
        <p className="text-gray-500 mt-1">Resumen general del sistema de inventario</p>
      </div>

      {/* TARJETAS PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Productos */}
            <Link to="/dashboard/productos" className="group">
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Productos</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.productos}</p>
                    <p className="text-xs text-gray-400 mt-2">Total registrados</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FaBox className="text-blue-600 text-xl" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Stock Bajo */}
            <Link to="/dashboard/productos?filter=stock_bajo" className="group">
              <div className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border-l-4 ${stats.stockBajo > 0 ? 'border-yellow-500' : 'border-green-500'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
                    <p className={`text-3xl font-bold mt-1 ${stats.stockBajo > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {stats.stockBajo}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {stats.stockBajo > 0 ? 'Requieren atención' : 'Todo en orden'}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${stats.stockBajo > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    <FaExclamationTriangle className={`text-xl ${stats.stockBajo > 0 ? 'text-yellow-600' : 'text-green-600'}`} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Lotes Activos */}
            <Link to="/dashboard/lotes" className="group">
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border-l-4 border-purple-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Lotes Activos</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.lotes}</p>
                    <p className="text-xs text-gray-400 mt-2">En inventario</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FaLayerGroup className="text-purple-600 text-xl" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Lotes Vencidos */}
            <Link to="/dashboard/lotes?filter=vencidos" className="group">
              <div className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border-l-4 ${stats.lotesVencidos > 0 ? 'border-red-500' : 'border-green-500'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Lotes Vencidos</p>
                    <p className={`text-3xl font-bold mt-1 ${stats.lotesVencidos > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.lotesVencidos}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {stats.lotesVencidos > 0 ? 'Requieren baja' : 'Sin vencidos'}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${stats.lotesVencidos > 0 ? 'bg-red-100 animate-pulse' : 'bg-green-100'}`}>
                    <FaCalendarTimes className={`text-xl ${stats.lotesVencidos > 0 ? 'text-red-600' : 'text-green-600'}`} />
                  </div>
                </div>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* ALERTAS */}
      {(stats.stockBajo > 0 || stats.lotesVencidos > 0 || stats.proximosVencer > 0) && (
        <div className="mb-8 space-y-3">
          {stats.lotesVencidos > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FaCalendarTimes className="text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-800">¡Atención! Tienes {stats.lotesVencidos} lote(s) vencido(s)</p>
                <p className="text-sm text-red-600">Deben ser dados de baja del inventario</p>
              </div>
              <Link to="/dashboard/lotes?filter=vencidos" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium">
                Ver lotes
              </Link>
            </div>
          )}
          
          {stats.proximosVencer > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <FaBell className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-yellow-800">{stats.proximosVencer} lote(s) próximo(s) a vencer</p>
                <p className="text-sm text-yellow-600">Vencen en los próximos 30 días</p>
              </div>
              <Link to="/dashboard/lotes" className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-medium">
                Revisar
              </Link>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* GRÁFICO */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Movimientos de Inventario</h2>
              <p className="text-sm text-gray-500">Última semana</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Entradas
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                Salidas
              </span>
            </div>
          </div>
          <div className="h-64">
            <canvas ref={ventasChartRef}></canvas>
          </div>
        </div>

        {/* PRODUCTOS CON STOCK BAJO */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Stock Bajo</h2>
            <Link to="/dashboard/productos?filter=stock_bajo" className="text-blue-600 text-sm hover:underline">
              Ver todos
            </Link>
          </div>
          
          {productosStockBajo.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaBox className="text-green-600 text-2xl" />
              </div>
              <p className="text-gray-500">¡Excelente!</p>
              <p className="text-sm text-gray-400">Todos los productos tienen stock suficiente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {productosStockBajo.map((producto) => (
                <div key={producto.producto_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{producto.nombre}</p>
                    <p className="text-xs text-gray-500">{producto.codigo_principal}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    producto.stock_actual === 0 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {producto.stock_actual} uds
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ÚLTIMOS MOVIMIENTOS */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Últimos Movimientos</h2>
          <Link to="/dashboard/kardex" className="text-blue-600 text-sm hover:underline">
            Ver Kardex completo
          </Link>
        </div>
        
        {ultimosMovimientos.length === 0 ? (
          <div className="text-center py-8">
            <FaChartLine className="text-gray-300 text-4xl mx-auto mb-3" />
            <p className="text-gray-500">No hay movimientos recientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Tipo</th>
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium">Lote</th>
                  <th className="pb-3 font-medium text-center">Cantidad</th>
                  <th className="pb-3 font-medium text-center">Stock</th>
                  <th className="pb-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ultimosMovimientos.map((mov, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        mov.tipo_movimiento === 'ENTRADA' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {mov.tipo_movimiento === 'ENTRADA' ? <FaArrowUp /> : <FaArrowDown />}
                        {mov.tipo_movimiento}
                      </span>
                    </td>
                    <td className="py-3">
                      <p className="font-medium text-gray-800">{mov.producto?.nombre || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{mov.tipo_documento}</p>
                    </td>
                    <td className="py-3">
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                        {mov.lote?.numero_lote || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-semibold ${
                        mov.tipo_movimiento === 'ENTRADA' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {mov.tipo_movimiento === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
                      </span>
                    </td>
                    <td className="py-3 text-center font-medium text-gray-800">
                      {mov.stock_resultante}
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {new Date(mov.fecha).toLocaleDateString('es-EC')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ACCIONES RÁPIDAS FLOTANTES */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <Link
          to="/dashboard/facturacion"
          className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 group"
          title="Nueva Venta"
        >
          <FaReceipt className="text-xl" />
          <span className="absolute right-full mr-3 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
            Nueva Venta
          </span>
        </Link>
        <Link
          to="/dashboard/ingresos"
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 group"
          title="Recepción de Mercadería"
        >
          <FaTruckLoading className="text-xl" />
          <span className="absolute right-full mr-3 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
            Recepción
          </span>
        </Link>
        <Link
          to="/dashboard/productos?action=new"
          className="w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 group"
          title="Nuevo Producto"
        >
          <FaPlus className="text-xl" />
          <span className="absolute right-full mr-3 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
            Nuevo Producto
          </span>
        </Link>
      </div>

    </div>
  );
}
