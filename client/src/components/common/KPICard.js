import React from 'react';

const KPICard = ({ title, value, icon, color, subtitle, onClick }) => {
  return (
    <div className="kpi-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="kpi-icon" style={{ backgroundColor: color + '20', color }}>{icon}</div>
      <div className="kpi-info">
        <div className="kpi-value">{value ?? 0}</div>
        <div className="kpi-title">{title}</div>
        {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default KPICard;
