import { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaDollarSign,
  FaPrint,
  FaEnvelope,
  FaMoneyBillWave,
  FaCalculator,
  FaCheckCircle,
  FaCashRegister,
  FaCheck,
} from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner";

/**
 * PaymentModal - Modal de cobro para el POS
 * 
 * Props:
 * - isOpen: boolean - Controla si el modal está abierto
 * - onClose: function - Callback para cerrar el modal
 * - total: number - Total a pagar
 * - onConfirm: function - Callback para confirmar (recibe { imprimir: boolean })
 * - loading: boolean - Estado de carga durante el procesamiento
 * - tipoDocumento: string - Tipo de documento (factura/nota_venta)
 * - formatCurrency: function - Función para formatear moneda
 */
export default function PaymentModal({
  isOpen,
  onClose,
  total = 0,
  onConfirm,
  loading = false,
  tipoDocumento = "factura",
  formatCurrency = (val) => `$${parseFloat(val || 0).toFixed(2)}`,
}) {
  const [dineroRecibido, setDineroRecibido] = useState("");
  const [cambio, setCambio] = useState(0);
  const [imprimirTicket, setImprimirTicket] = useState(true);
  const inputRef = useRef(null);

  // Focus en el input cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setDineroRecibido("");
      setCambio(0);
      setImprimirTicket(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Calcular cambio en tiempo real
  useEffect(() => {
    const recibido = parseFloat(dineroRecibido) || 0;
    const cambioCalculado = recibido - total;
    setCambio(cambioCalculado >= 0 ? cambioCalculado : 0);
  }, [dineroRecibido, total]);

  // Verificar si el dinero recibido es suficiente
  const dineroSuficiente = parseFloat(dineroRecibido || 0) >= total;

  // Manejar teclas rápidas
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && dineroSuficiente && !loading) {
      onConfirm({ imprimir: imprimirTicket });
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  // Botones de dinero rápido
  const botonesRapidos = [
    { label: "Exacto", value: total },
    { label: "$1", value: (parseFloat(dineroRecibido) || 0) + 1 },
    { label: "$5", value: (parseFloat(dineroRecibido) || 0) + 5 },
    { label: "$10", value: (parseFloat(dineroRecibido) || 0) + 10 },
    { label: "$20", value: (parseFloat(dineroRecibido) || 0) + 20 },
    { label: "$50", value: (parseFloat(dineroRecibido) || 0) + 50 },
    { label: "$100", value: (parseFloat(dineroRecibido) || 0) + 100 },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <FaCashRegister className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Cobrar Venta</h2>
                <p className="text-green-100 text-sm">
                  {tipoDocumento === "factura" ? "Factura Electrónica" : "Nota de Venta"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-white/20 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              <FaTimes className="text-white text-xl" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Total a pagar - Grande y destacado */}
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-1">TOTAL A PAGAR</p>
            <p className="text-4xl font-bold text-white">
              {formatCurrency(total)}
            </p>
          </div>

          {/* Input de dinero recibido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dinero Recibido
            </label>
            <div className="relative">
              <FaMoneyBillWave className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 text-xl" />
              <input
                ref={inputRef}
                type="number"
                value={dineroRecibido}
                onChange={(e) => setDineroRecibido(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={loading}
                className={`w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 rounded-xl focus:outline-none transition ${
                  dineroRecibido === ""
                    ? "border-gray-300 focus:border-blue-500"
                    : dineroSuficiente
                    ? "border-green-500 bg-green-50 focus:border-green-600"
                    : "border-red-400 bg-red-50 focus:border-red-500"
                }`}
              />
            </div>
          </div>

          {/* Botones de dinero rápido */}
          <div className="flex flex-wrap gap-2">
            {botonesRapidos.map((btn) => (
              <button
                key={btn.label}
                onClick={() => setDineroRecibido(btn.value.toFixed(2))}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition cursor-pointer disabled:opacity-50"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Cambio */}
          <div
            className={`rounded-xl p-4 flex items-center justify-between ${
              dineroSuficiente
                ? "bg-green-50 border-2 border-green-200"
                : "bg-gray-100 border-2 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <FaCalculator
                className={`text-2xl ${
                  dineroSuficiente ? "text-green-500" : "text-gray-400"
                }`}
              />
              <div>
                <p className="text-sm text-gray-500">Cambio a devolver</p>
                <p
                  className={`text-2xl font-bold ${
                    dineroSuficiente ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {formatCurrency(cambio)}
                </p>
              </div>
            </div>
            {dineroSuficiente && (
              <FaCheckCircle className="text-green-500 text-3xl" />
            )}
          </div>

          {/* Mensaje de dinero insuficiente */}
          {dineroRecibido !== "" && !dineroSuficiente && (
            <p className="text-red-500 text-sm text-center">
              Faltan {formatCurrency(total - (parseFloat(dineroRecibido) || 0))} para completar el pago
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="bg-gray-50 px-6 py-4 space-y-4">
          {/* Checkbox de imprimir ticket */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => !loading && setImprimirTicket(!imprimirTicket)}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition cursor-pointer ${
                imprimirTicket
                  ? "bg-green-500 border-green-500"
                  : "bg-white border-gray-300 hover:border-gray-400"
              }`}
            >
              {imprimirTicket && <FaCheck className="text-white text-sm" />}
            </div>
            <div className="flex items-center gap-2">
              <FaPrint className={imprimirTicket ? "text-green-600" : "text-gray-400"} />
              <span className={`font-medium ${imprimirTicket ? "text-gray-800" : "text-gray-500"}`}>
                Imprimir ticket al confirmar
              </span>
            </div>
          </label>

          {/* Botón principal - Confirmar */}
          <button
            onClick={() => onConfirm({ imprimir: imprimirTicket })}
            disabled={!dineroSuficiente || loading}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition cursor-pointer"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Procesando...
              </>
            ) : (
              <>
                <FaCheckCircle className="text-xl" />
                Confirmar Venta
              </>
            )}
          </button>

          {/* Botón cancelar */}
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          {/* Atajo de teclado */}
          <p className="text-center text-xs text-gray-400">
            Presiona <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">Enter</kbd> para confirmar • 
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 ml-1">Esc</kbd> para cancelar
          </p>
        </div>
      </div>
    </div>
  );
}
