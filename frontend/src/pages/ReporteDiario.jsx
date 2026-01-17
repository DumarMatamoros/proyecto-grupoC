import { useState, useEffect } from "react";
import {
  FaChartBar,
  FaCalendarAlt,
  FaPrint,
  FaFileExcel,
  FaFilePdf,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaMoneyBillWave,
  FaCreditCard,
  FaUniversity,
  FaReceipt,
  FaWallet,
  FaUser,
  FaBoxOpen,
} from "react-icons/fa";
import api from "../services/api";
import { downloadDailyReport } from "../services/downloadService";
import PrintModal from "../components/PrintModal";
import LoadingSpinner from "../components/LoadingSpinner";
import useToast from "../hooks/useToast";

export default function ReporteDiario() {
  const toast = useToast();
  
  // Estados
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState(null);
  
  // Modal de impresión
  const [printModal, setPrintModal] = useState({
    isOpen: false,
    documentUrl: "",
    title: "",
  });

  // Cargar datos del reporte
  const cargarReporte = async (fechaSeleccionada = fecha) => {
    setLoading(true);
    try {
      const response = await api.get('/sales/report/daily/data', {
        params: { fecha: fechaSeleccionada }
      });
      setData(response.data);
    } catch (error) {
      console.error('Error cargando reporte:', error);
      toast.error('Error al cargar el reporte diario');
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar y cuando cambia la fecha
  useEffect(() => {
    cargarReporte();
  }, []);

  // Manejar cambio de fecha
  const handleFechaChange = (e) => {
    const nuevaFecha = e.target.value;
    setFecha(nuevaFecha);
  };

  // Generar reporte
  const handleGenerarReporte = () => {
    cargarReporte(fecha);
  };

  // Exportar PDF
  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await downloadDailyReport(fecha, 'pdf');
      toast.success('Reporte PDF descargado');
    } catch (error) {
      toast.error('Error al exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  // Imprimir reporte
  const handlePrint = () => {
    setPrintModal({
      isOpen: true,
      documentUrl: `/sales/report/daily?fecha=${fecha}&format=pdf`,
      title: `Reporte Diario - ${fecha}`,
    });
  };

  // Formatear moneda
  const formatCurrency = (value) => {
    return `$${parseFloat(value || 0).toFixed(2)}`;
  };

  // Obtener icono de forma de pago
  const getFormaPagoIcon = (formaPago) => {
    const icons = {
      efectivo: FaMoneyBillWave,
      tarjeta: FaCreditCard,
      transferencia: FaUniversity,
      cheque: FaReceipt,
      credito: FaWallet,
    };
    return icons[formaPago] || FaMoneyBillWave;
  };

  // Obtener color de forma de pago
  const getFormaPagoColor = (formaPago) => {
    const colors = {
      efectivo: 'text-green-600 bg-green-100',
      tarjeta: 'text-blue-600 bg-blue-100',
      transferencia: 'text-purple-600 bg-purple-100',
      cheque: 'text-orange-600 bg-orange-100',
      credito: 'text-red-600 bg-red-100',
    };
    return colors[formaPago] || 'text-gray-600 bg-gray-100';
  };

  // Renderizar variación
  const renderVariacion = (valor, colorPositivo = 'text-green-600', colorNegativo = 'text-red-600') => {
    const esPositivo = valor >= 0;
    const Icon = esPositivo ? FaArrowUp : FaArrowDown;
    const color = esPositivo ? colorPositivo : colorNegativo;
    
    return (
      <p className={`text-xs ${color} flex items-center gap-1 mt-2`}>
        <Icon />
        {Math.abs(valor).toFixed(1)}% vs ayer
      </p>
    );
  };

  // Calcular altura de barra para gráfico
  const getBarHeight = (valor, max) => {
    if (max === 0) return 0;
    return Math.max((valor / max) * 100, 5);
  };

  // Obtener máximo de ventas por hora
  const maxVentaHora = data?.ventas_por_hora 
    ? Math.max(...Object.values(data.ventas_por_hora).map(v => v.total))
    : 0;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <FaChartBar className="text-blue-600" />
            Reporte Diario
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <FaCalendarAlt className="text-gray-400" />
            {data?.fecha_formateada || 'Cargando...'}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition cursor-pointer disabled:opacity-50"
          >
            <FaPrint />
            Imprimir
          </button>
          <button 
            onClick={handleExportPdf}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FaFilePdf />
            )}
            PDF
          </button>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Seleccionar fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={handleFechaChange}
              max={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button 
            onClick={handleGenerarReporte}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <FaSync className="animate-spin" />
            ) : (
              <FaSync />
            )}
            Generar Reporte
          </button>
        </div>
      </div>

      {/* Resumen del día */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Ventas Totales</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {formatCurrency(data?.resumen?.ventas_totales)}
              </p>
              {renderVariacion(data?.resumen?.variacion_ventas || 0)}
            </div>
            <FaMoneyBillWave className="text-4xl text-green-200" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Transacciones</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {data?.resumen?.transacciones || 0}
              </p>
              {renderVariacion(data?.resumen?.variacion_transacciones || 0, 'text-blue-600', 'text-red-600')}
            </div>
            <FaReceipt className="text-4xl text-blue-200" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Ticket Promedio</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {formatCurrency(data?.resumen?.ticket_promedio)}
              </p>
              {renderVariacion(data?.resumen?.variacion_ticket || 0, 'text-purple-600', 'text-red-600')}
            </div>
            <FaChartBar className="text-4xl text-purple-200" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Productos Vendidos</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {data?.resumen?.productos_vendidos || 0}
              </p>
              {renderVariacion(data?.resumen?.variacion_productos || 0, 'text-yellow-600', 'text-red-600')}
            </div>
            <FaBoxOpen className="text-4xl text-yellow-200" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por hora */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas por Hora</h3>
          <div className="h-64 flex items-end gap-1 px-2">
            {data?.ventas_por_hora && Object.entries(data.ventas_por_hora).map(([hora, valores]) => (
              <div 
                key={hora} 
                className="flex-1 flex flex-col items-center group"
                title={`${hora}: ${formatCurrency(valores.total)} (${valores.cantidad} ventas)`}
              >
                <div 
                  className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all cursor-pointer min-h-[4px]"
                  style={{ height: `${getBarHeight(valores.total, maxVentaHora)}%` }}
                />
                <span className="text-[9px] text-gray-400 mt-1 -rotate-45 origin-top-left">
                  {hora.split(':')[0]}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-500">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
        </div>

        {/* Formas de pago */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Formas de Pago</h3>
          {data?.formas_pago?.length > 0 ? (
            <div className="space-y-4">
              {data.formas_pago.map((fp) => {
                const Icon = getFormaPagoIcon(fp.forma_pago);
                const colorClass = getFormaPagoColor(fp.forma_pago);
                const porcentaje = data.resumen.ventas_totales > 0 
                  ? (fp.total / data.resumen.ventas_totales) * 100 
                  : 0;
                
                return (
                  <div key={fp.forma_pago} className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${colorClass}`}>
                      <Icon className="text-xl" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-gray-700">{fp.label}</span>
                        <span className="font-bold text-gray-800">{formatCurrency(fp.total)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>{fp.cantidad} transacciones</span>
                        <span>{porcentaje.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FaCreditCard className="text-4xl mx-auto mb-2 opacity-30" />
                <p>No hay ventas registradas</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top productos */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Productos Más Vendidos</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Código</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Producto</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Cantidad</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Total Vendido</th>
              </tr>
            </thead>
            <tbody>
              {data?.top_productos?.length > 0 ? (
                data.top_productos.map((producto, index) => (
                  <tr key={producto.producto_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-200 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm text-gray-500">{producto.codigo}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{producto.nombre}</td>
                    <td className="py-3 px-4 text-right font-semibold">{producto.cantidad}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">
                      {formatCurrency(producto.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    <FaBoxOpen className="text-4xl mx-auto mb-2 text-gray-300" />
                    <p>No hay productos vendidos en esta fecha</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de caja por cajero */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas por Cajero</h3>
        {data?.por_cajero?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.por_cajero.map((cajero) => (
              <div key={cajero.usuario_id} className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <FaUser className="text-xl text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{cajero.nombre}</p>
                  <p className="text-sm text-gray-500">{cajero.cantidad} transacciones</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800">{formatCurrency(cajero.total)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FaUser className="text-4xl mx-auto mb-2 opacity-30" />
            <p>No hay ventas registradas</p>
          </div>
        )}
      </div>

      {/* Totales generales */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen del Día</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Subtotal</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(data?.totales?.subtotal)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-green-600">IVA Recaudado</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(data?.totales?.iva)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600">Descuentos</p>
            <p className="text-xl font-bold text-red-700">-{formatCurrency(data?.totales?.descuentos)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-600">Total del Día</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(data?.totales?.total)}</p>
          </div>
        </div>
      </div>

      {/* Modal de impresión */}
      <PrintModal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal({ ...printModal, isOpen: false })}
        documentUrl={printModal.documentUrl}
        title={printModal.title}
        size="invoice"
      />
    </div>
  );
}
