import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaSearch, FaChevronDown, FaTimes } from "react-icons/fa";

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  displayKey = "label",
  valueKey = "value",
  renderOption = null,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calcular posición del dropdown
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus en el input de búsqueda al abrir y actualizar posición
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  // Actualizar posición al hacer scroll o resize
  useEffect(() => {
    if (!isOpen) return;
    
    const handleUpdate = () => updateDropdownPosition();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);
    
    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen]);

  // Filtrar opciones
  const filteredOptions = options.filter((opt) => {
    const label = typeof opt === "object" ? opt[displayKey] : opt;
    return label?.toString().toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Obtener el label del valor seleccionado
  const selectedOption = options.find((opt) => {
    const optValue = typeof opt === "object" ? opt[valueKey] : opt;
    return optValue?.toString() === value?.toString();
  });

  const selectedLabel = selectedOption
    ? typeof selectedOption === "object"
      ? selectedOption[displayKey]
      : selectedOption
    : "";

  const handleSelect = (opt) => {
    const optValue = typeof opt === "object" ? opt[valueKey] : opt;
    onChange(optValue?.toString());
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  // Dropdown con portal para evitar problemas de overflow
  const dropdownContent = isOpen && createPortal(
    <div 
      ref={dropdownRef}
      className="bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden"
      style={{
        position: "fixed",
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 9999,
      }}
    >
      {/* Barra de búsqueda */}
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Lista de opciones */}
      <div className="overflow-y-auto max-h-48">
        {filteredOptions.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            No se encontraron resultados
          </div>
        ) : (
          filteredOptions.map((opt, idx) => {
            const optValue = typeof opt === "object" ? opt[valueKey] : opt;
            const optLabel = typeof opt === "object" ? opt[displayKey] : opt;
            const isSelected = optValue?.toString() === value?.toString();

            return (
              <div
                key={optValue || idx}
                onClick={() => handleSelect(opt)}
                className={`px-4 py-2 text-sm cursor-pointer transition ${
                  isSelected
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {renderOption ? renderOption(opt) : optLabel}
              </div>
            );
          })
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white flex items-center justify-between gap-2 cursor-pointer hover:border-gray-400 transition"
      >
        <span className={`truncate ${!selectedLabel ? "text-gray-400" : "text-gray-800"}`}>
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded transition"
            >
              <FaTimes className="text-gray-400 text-xs" />
            </span>
          )}
          <FaChevronDown className={`text-gray-400 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {dropdownContent}
    </div>
  );
}
