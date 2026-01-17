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
      className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-2 overflow-hidden transform transition-all max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl">
                <FaCashRegister className="text-white text-lg sm:text-xl" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Cobrar Venta</h2>
                <p className="text-green-100 text-xs sm:text-sm">
                  {tipoDocumento === "factura" ? "Factura Electrónica" : "Nota de Venta"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              <FaTimes className="text-white text-lg sm:text-xl" />
            </button>
          </div>
        </div>

        {/* Contenido - con scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Total a pagar - Grande y destacado */}
          <div className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 text-center">
            <p className="text-gray-400 text-xs sm:text-sm mb-1">TOTAL A PAGAR</p>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {formatCurrency(total)}
            </p>
          </div>

          {/* Input de dinero recibido */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Dinero Recibido
            </label>
            <div className="relative">
              <FaMoneyBillWave className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-lg sm:text-xl" />
              <input
                ref={inputRef}
                type="number"
                value={dineroRecibido}
                onChange={(e) => setDineroRecibido(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={loading}
                className={`w-full pl-10 sm:pl-12 pr-3 py-3 text-xl sm:text-2xl font-bold border-2 rounded-lg sm:rounded-xl focus:outline-none transition ${
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
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {botonesRapidos.map((btn) => (
              <button
                key={btn.label}
                onClick={() => setDineroRecibido(btn.value.toFixed(2))}
                disabled={loading}
                className="px-2.5 sm:px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition cursor-pointer disabled:opacity-50 text-sm"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Cambio */}
          <div
            className={`rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between ${
              dineroSuficiente
                ? "bg-green-50 border-2 border-green-200"
                : "bg-gray-100 border-2 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <FaCalculator
                className={`text-xl sm:text-2xl ${
                  dineroSuficiente ? "text-green-500" : "text-gray-400"
                }`}
              />
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Cambio a devolver</p>
                <p
                  className={`text-lg sm:text-xl font-bold ${
                    dineroSuficiente ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {formatCurrency(cambio)}
                </p>
              </div>
            </div>
            {dineroSuficiente && (
              <FaCheckCircle className="text-green-500 text-2xl sm:text-3xl" />
            )}
          </div>

          {/* Mensaje de dinero insuficiente */}
          {dineroRecibido !== "" && !dineroSuficiente && (
            <p className="text-red-500 text-xs sm:text-sm text-center">
              Faltan {formatCurrency(total - (parseFloat(dineroRecibido) || 0))} para completar el pago
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex-shrink-0 bg-gray-50 px-4 py-3 sm:px-5 sm:py-4 space-y-3">
          {/* Checkbox de imprimir ticket */}
          <label className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none">
            <div
              onClick={() => !loading && setImprimirTicket(!imprimirTicket)}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 flex items-center justify-center transition cursor-pointer ${
                imprimirTicket
                  ? "bg-green-500 border-green-500"
                  : "bg-white border-gray-300 hover:border-gray-400"
              }`}
            >
              {imprimirTicket && <FaCheck className="text-white text-xs sm:text-sm" />}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <FaPrint className={`text-sm ${imprimirTicket ? "text-green-600" : "text-gray-400"}`} />
              <span className={`font-medium text-sm ${imprimirTicket ? "text-gray-800" : "text-gray-500"}`}>
                Imprimir ticket al confirmar
              </span>
            </div>
          </label>

          {/* Botón principal - Confirmar */}
          <button
            onClick={() => onConfirm({ imprimir: imprimirTicket })}
            disabled={!dineroSuficiente || loading}
            className="w-full py-3 sm:py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg sm:rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Procesando...
              </>
            ) : (
              <>
                <FaCheckCircle className="text-lg" />
                Confirmar Venta
              </>
            )}
          </button>

          {/* Botón cancelar */}
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-medium transition cursor-pointer disabled:opacity-50 text-sm sm:text-base"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
