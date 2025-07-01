interface PICO88IconProps {
  className?: string;
  fill?: string;
}

export function PICO88Icon({ className = "w-12 h-12", fill = "currentColor" }: PICO88IconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="-40 0 150 150"
      className={className}
    >
      <path 
        d="M 60 0 L 0 20 L 20 80 L -10 90 L 10 150 L 20 130 L 10 100 L 40 90 L 50 120 L 20 130 L 10 150 L 70 130 L 50 70 L 80 60 L 60 0 L 50 20 L 60 50 L 30 60 L 20 30 L 50 20 Z" 
        fill={fill}
      />
    </svg>
  );
}
