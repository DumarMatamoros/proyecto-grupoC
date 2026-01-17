import { useRef, useEffect, useState, useCallback } from "react";
import { FaTimes, FaPrint, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import { fetchBlobUrl, revokeBlobUrl } from "../services/downloadService";

/**
 * Modal para previsualizar e imprimir documentos (facturas, tickets)
 * Carga el PDF como blob para incluir el token de autenticación
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {function} props.onClose - Función para cerrar el modal
 * @param {string} props.documentUrl - URL relativa del endpoint (ej: /sales/1/ticket)
 * @param {object} props.documentParams - Parámetros adicionales para la petición
 * @param {string} props.title - Título del modal
 * @param {string} props.size - Tamaño del modal: 'ticket' (80mm) | 'invoice' (A4) | 'auto'
 */
export default function PrintModal({ 
  isOpen, 
  onClose, 
  documentUrl, 
  documentParams = { format: 'pdf' },
  title = "Vista Previa",
  size = "auto"
}) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);

  // Cargar el documento como blob
  const loadDocument = useCallback(async () => {
    if (!documentUrl) return;
    
    setLoading(true);
    setError(false);
    
    // Limpiar blob anterior
    if (blobUrl) {
      revokeBlobUrl(blobUrl);
      setBlobUrl(null);
    }
    
    try {
      const url = await fetchBlobUrl(documentUrl, documentParams);
      setBlobUrl(url);
      setLoading(false);
    } catch (err) {
      console.error("Error cargando documento:", err);
      setError(true);
      setLoading(false);
    }
  }, [documentUrl, documentParams]);

  // Cargar documento cuando se abre el modal
  useEffect(() => {
    if (isOpen && documentUrl) {
      loadDocument();
    }
    
    // Limpiar blob cuando se cierra
    return () => {
      if (blobUrl) {
        revokeBlobUrl(blobUrl);
      }
    };
  }, [isOpen, documentUrl]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Cerrar y limpiar
  const handleClose = () => {
    if (blobUrl) {
      revokeBlobUrl(blobUrl);
      setBlobUrl(null);
    }
    onClose();
  };

  // Manejar la impresión
  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      } catch (err) {
        console.error("Error al imprimir:", err);
        // Fallback: abrir en nueva pestaña para imprimir
        if (blobUrl) {
          window.open(blobUrl, "_blank");
        }
      }
    }
  };

  if (!isOpen) return null;

  // Determinar el ancho del modal según el tipo de documento
  const getModalWidth = () => {
    switch (size) {
      case "ticket":
        return "max-w-sm"; // ~384px, apropiado para ticket 80mm
      case "invoice":
        return "max-w-4xl"; // ~896px, apropiado para A4
      default:
        return "max-w-3xl"; // Por defecto
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${getModalWidth()} max-h-[95vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FaPrint className="text-blue-200" />
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            title="Cerrar"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Cuerpo - Iframe */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden" style={{ minHeight: "500px" }}>
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600">Cargando documento...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">No se pudo cargar el documento</p>
                <button
                  onClick={loadDocument}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Iframe - Solo se muestra cuando hay blobUrl */}
          {blobUrl && !error && (
            <iframe
              ref={iframeRef}
              src={blobUrl}
              className="w-full h-full border-0"
              style={{ minHeight: "500px", height: "calc(95vh - 180px)" }}
              title={title}
            />
          )}
        </div>

        {/* Footer - Botones */}
        <div className="px-5 py-4 border-t bg-gray-50 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            {size === "ticket" ? "Formato: Ticket 80mm" : "Formato: A4"}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              disabled={loading || error}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaPrint />
              IMPRIMIR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
