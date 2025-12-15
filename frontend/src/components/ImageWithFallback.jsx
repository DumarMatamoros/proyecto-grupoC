import { useState } from "react";
import { FaImage } from "react-icons/fa";

export default function ImageWithFallback({
  src,
  alt = "Imagen",
  className = "w-12 h-12 object-cover rounded",
}) {
  const [error, setError] = useState(false);

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
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
