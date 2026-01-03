import React from 'react';

interface Button3DProps {
  children: React.ReactNode;
  onClick: () => void;
  color?: 'red' | 'green' | 'blue' | 'gold';
  fullWidth?: boolean;
  className?: string;
}

const Button3D: React.FC<Button3DProps> = ({ 
  children, 
  onClick, 
  color = 'red', 
  fullWidth = false,
  className = ''
}) => {
  
  const colorMap = {
    red: 'bg-[#B22222] border-[#800000] text-white active:bg-[#a01f1f]',
    green: 'bg-green-600 border-green-800 text-white active:bg-green-700',
    blue: 'bg-blue-600 border-blue-800 text-white active:bg-blue-700',
    gold: 'bg-[#FFD700] border-[#DAA520] text-[#8B5A2B] active:bg-[#f0c800]',
  };

  const baseClasses = `
    relative
    font-bold 
    py-3 px-6 
    rounded-lg 
    border-b-[6px] 
    active:border-b-0 
    active:translate-y-[6px] 
    transition-all 
    duration-100
    uppercase
    tracking-wider
    shadow-lg
  `;

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${colorMap[color]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button3D;