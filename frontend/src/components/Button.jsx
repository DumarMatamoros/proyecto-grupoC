const Button = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 
      text-white font-semibold transition shadow-sm ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
