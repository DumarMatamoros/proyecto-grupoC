import { useState } from "react";
import { FaImage, FaSearchPlus } from "react-icons/fa";
import ImageLightbox from "./ImageLightbox";

export default function ImageWithFallback({
  src,
  alt = "Imagen",
  className = "w-12 h-12 object-cover rounded",
  enableLightbox = false,
}) {
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleClick = (e) => {
    if (enableLightbox && src && !error) {
      e.stopPropagation();
      setLightboxOpen(true);
    }
  };

  const handleClose = () => {
    setLightboxOpen(false);
  };

  if (error || !src) {
    return (
      <div
        className={`${className} bg-gray-200 flex items-center justify-center`}
      >
        <FaImage className="text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative inline-flex ${enableLightbox ? "cursor-zoom-in group" : ""}`}
        onClick={handleClick}
      >
        <img
          src={src}
          alt={alt}
          className={className}
          onError={() => setError(true)}
        />
        {/* Overlay con ícono de zoom al hacer hover (solo si lightbox está habilitado) */}
        {enableLightbox && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded pointer-events-none">
            <FaSearchPlus className="text-white text-sm" />
          </div>
        )}
      </div>

      {/* Lightbox para ver imagen en grande */}
      {enableLightbox && (
        <ImageLightbox
          src={src}
          alt={alt}
          isOpen={lightboxOpen}
          onClose={handleClose}
        />
      )}
    </>
  );
}
