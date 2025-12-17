import { useEffect } from "react";
import { FaTimes, FaImage } from "react-icons/fa";

/**
 * Componente Lightbox para visualizar imágenes en grande
 * @param {string} src - URL de la imagen
 * @param {string} alt - Texto alternativo de la imagen
 * @param {boolean} isOpen - Controla si el lightbox está abierto
 * @param {function} onClose - Callback para cerrar el lightbox
 */
export default function ImageLightbox({ src, alt = "Imagen", isOpen, onClose }) {
  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevenir scroll del body cuando el lightbox está abierto
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        title="Cerrar (Esc)"
      >
        <FaTimes className="text-xl" />
      </button>

      {/* Contenedor de imagen */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        
        {/* Fallback cuando no hay imagen */}
        {!src && (
          <div className="w-64 h-64 bg-gray-700 rounded-lg flex flex-col items-center justify-center gap-4">
            <FaImage className="text-6xl text-gray-500" />
            <span className="text-gray-400">Sin imagen disponible</span>
          </div>
        )}

        {/* Texto de ayuda */}
        <p className="text-center text-white/60 text-sm mt-3">
          Presiona <kbd className="px-2 py-1 bg-white/10 rounded text-white/80">Esc</kbd> o haz clic fuera para cerrar
        </p>
      </div>
    </div>
  );
}
