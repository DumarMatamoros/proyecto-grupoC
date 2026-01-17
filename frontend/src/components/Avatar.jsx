import { useState } from "react";

/**
 * Componente Avatar reutilizable que muestra:
 * - La imagen del avatar si existe
 * - O la inicial del nombre como fallback
 * 
 * @param {Object} props
 * @param {string} props.src - URL de la imagen del avatar (opcional)
 * @param {string} props.name - Nombre del usuario para extraer la inicial
 * @param {string} props.size - Tamaño: 'xs', 'sm', 'md', 'lg', 'xl' (default: 'md')
 * @param {string} props.className - Clases CSS adicionales
 * @param {boolean} props.showBorder - Mostrar borde (default: false)
 * @param {string} props.borderColor - Color del borde (default: 'border-gray-200')
 */
export default function Avatar({ 
  src, 
  name = "Usuario", 
  size = "md", 
  className = "",
  showBorder = false,
  borderColor = "border-gray-200"
}) {
  const [imageError, setImageError] = useState(false);

  // Obtener la inicial del nombre
  const getInitial = () => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  // Generar un color de fondo basado en el nombre (consistente)
  const getBackgroundColor = () => {
    const colors = [
      "from-blue-400 to-blue-600",
      "from-green-400 to-green-600",
      "from-purple-400 to-purple-600",
      "from-pink-400 to-pink-600",
      "from-indigo-400 to-indigo-600",
      "from-teal-400 to-teal-600",
      "from-orange-400 to-orange-600",
      "from-cyan-400 to-cyan-600",
      "from-rose-400 to-rose-600",
      "from-amber-400 to-amber-600",
    ];
    
    // Usar el código ASCII del primer carácter para seleccionar color
    const charCode = name ? name.charCodeAt(0) : 0;
    const index = charCode % colors.length;
    return colors[index];
  };

  // Tamaños predefinidos
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-20 h-20 text-2xl",
    "3xl": "w-28 h-28 text-4xl",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const borderClass = showBorder ? `border-4 ${borderColor}` : "";

  // Si hay imagen y no hubo error, mostrar imagen
  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={`Avatar de ${name}`}
        className={`rounded-full object-cover ${sizeClass} ${borderClass} ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback: mostrar inicial con gradiente
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${getBackgroundColor()} flex items-center justify-center ${sizeClass} ${borderClass} ${className}`}
      title={name}
    >
      <span className="font-bold text-white">{getInitial()}</span>
    </div>
  );
}

/**
 * Hook para obtener la URL del avatar desde localStorage
 */
export function useUserAvatar() {
  const getUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const user = getUser();

  return {
    avatarUrl: user?.avatar || null,
    userName: user?.nombre || "Usuario",
    userInitial: user?.nombre?.charAt(0)?.toUpperCase() || "U",
  };
}
