// client/src/components/ui/Icon.jsx
import React, { useState } from 'react';

const Icon = ({ name, category = 'nav', fallback, className = '', style = {}, ...props }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !name) {
    return (
      <span 
        className={`inline-flex items-center justify-center ${className}`}
        style={{ display: 'inline-block', ...style }}
        role="img"
        aria-label="icône"
        {...props}
      >
        {fallback || '🔹'}
      </span>
    );
  }

  const svgPath = `/assets/icons/${category}/${name}.svg`;

  return (
    <img
      src={svgPath}
      alt=""
      className={`inline-block object-contain ${className}`}
      style={{ width: '1.25rem', height: '1.25rem', ...style }}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};

export default Icon;