import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-bronze-neon hover:bg-bronze-deep text-white shadow-lg shadow-bronze-neon/20",
    secondary: "bg-graphite-100 dark:bg-graphite-800 hover:bg-graphite-200 dark:hover:bg-graphite-700 text-graphite-900 dark:text-graphite-100",
    ghost: "bg-transparent hover:bg-graphite-100 dark:hover:bg-graphite-800 text-graphite-600 dark:text-graphite-300",
    outline: "bg-transparent border border-graphite-200 dark:border-graphite-700 hover:bg-graphite-50 dark:hover:bg-graphite-800 text-graphite-600 dark:text-graphite-300"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};