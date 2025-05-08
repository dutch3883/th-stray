import React from 'react';

type CatPawWatermarkProps = {
  className?: string;
  opacity?: number;
  density?: 'light' | 'medium' | 'dense';
  color?: string;
};

const CatPawWatermark: React.FC<CatPawWatermarkProps> = ({
  className = '',
  opacity = 0.05,
  density = 'medium',
  color = '#3B82F6', // This won't affect external SVG directly
}) => {
  // Configure pattern density
  const getPatternConfig = () => {
    switch (density) {
      case 'light':
        return { width: 200, height: 200, patternUnits: "userSpaceOnUse" };
      case 'dense':
        return { width: 100, height: 100, patternUnits: "userSpaceOnUse" };
      case 'medium':
      default:
        return { width: 150, height: 150, patternUnits: "userSpaceOnUse" };
    }
  };

  const patternConfig = getPatternConfig();

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} style={{ opacity }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern 
            id="cat-paw-pattern" 
            width={patternConfig.width} 
            height={patternConfig.height} 
            patternUnits={patternConfig.patternUnits}
          >
            {/* Using the external SVG file */}
            <image 
              href="/images/paw-print-bold-svgrepo-com.svg" 
              width="32" 
              height="32" 
              x="10" 
              y="10" 
            />
            <image 
              href="/images/paw-print-bold-svgrepo-com.svg" 
              width="28" 
              height="28" 
              x="90" 
              y="80" 
              transform="rotate(30, 104, 94)" 
            />
            <image 
              href="/images/paw-print-bold-svgrepo-com.svg" 
              width="24" 
              height="24" 
              x="40" 
              y="120" 
              transform="rotate(-15, 52, 132)" 
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cat-paw-pattern)" />
      </svg>
    </div>
  );
};

export default CatPawWatermark; 