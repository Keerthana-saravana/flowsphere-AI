import React, { useState } from 'react';

// Common Chart Tooltip Helper
interface TooltipProps {
  x: number;
  y: number;
  label: string;
  value: string | number;
  visible: boolean;
}

const ChartTooltip: React.FC<TooltipProps> = ({ x, y, label, value, visible }) => {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute',
      left: `${x}px`,
      top: `${y - 45}px`,
      transform: 'translateX(-50%)',
      backgroundColor: '#1E293B',
      color: '#FFFFFF',
      padding: '0.4rem 0.8rem',
      borderRadius: '8px',
      fontSize: '0.75rem',
      pointerEvents: 'none',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 50,
      whiteSpace: 'nowrap',
      transition: 'left 0.1s ease, top 0.1s ease'
    }}>
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div style={{ color: '#93C5FD', marginTop: '0.1rem' }}>{value}</div>
    </div>
  );
};

// ==========================================
// 1. AREA CHART (SVG Gradient Trend)
// ==========================================
interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export const SVGAreaChart: React.FC<AreaChartProps> = ({ data, height = 220 }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, label: '', value: '', visible: false });

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = 500;
  const chartHeight = height;

  const maxVal = Math.max(...data.map(d => d.value), 1) * 1.15;
  const pointsCount = data.length;

  // Calculate coordinates
  const getCoords = (index: number, val: number) => {
    const x = padding.left + (index / (pointsCount - 1)) * (chartWidth - padding.left - padding.right);
    const y = chartHeight - padding.bottom - (val / maxVal) * (chartHeight - padding.top - padding.bottom);
    return { x, y };
  };

  // Generate Path
  let pathD = '';
  let areaD = '';

  if (data.length > 0) {
    const firstPoint = getCoords(0, data[0].value);
    pathD = `M ${firstPoint.x} ${firstPoint.y}`;
    areaD = `M ${firstPoint.x} ${chartHeight - padding.bottom} L ${firstPoint.x} ${firstPoint.y}`;

    for (let i = 1; i < data.length; i++) {
      const pt = getCoords(i, data[i].value);
      pathD += ` L ${pt.x} ${pt.y}`;
      areaD += ` L ${pt.x} ${pt.y}`;
    }

    const lastPoint = getCoords(data.length - 1, data[data.length - 1].value);
    areaD += ` L ${lastPoint.x} ${chartHeight - padding.bottom} Z`;
  }

  const handleMouseMove = (index: number, e: React.MouseEvent) => {
    const pt = getCoords(index, data[index].value);
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipX = pt.x * (rect.width / chartWidth);
    const tooltipY = pt.y * (rect.height / chartHeight);
    
    setHoverIndex(index);
    setTooltip({
      x: tooltipX,
      y: tooltipY,
      label: data[index].label,
      value: `${data[index].value} Requests`,
      visible: true
    });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-blue)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary-blue)" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + ratio * (chartHeight - padding.top - padding.bottom);
          return (
            <line
              key={idx}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Areas */}
        {areaD && <path d={areaD} fill="url(#chartGradient)" />}
        {pathD && <path d={pathD} fill="none" stroke="var(--primary-blue)" strokeWidth="3" strokeLinecap="round" />}

        {/* Hover lines & markers */}
        {data.map((d, idx) => {
          const pt = getCoords(idx, d.value);
          const isHovered = hoverIndex === idx;
          return (
            <g key={idx}>
              {/* Invisible interactive zone */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="16"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseMove={(e) => handleMouseMove(idx, e)}
                onMouseLeave={handleMouseLeave}
              />
              {/* Hover vertical alignment line */}
              {isHovered && (
                <line
                  x1={pt.x}
                  y1={padding.top}
                  x2={pt.x}
                  y2={chartHeight - padding.bottom}
                  stroke="var(--accent-blue)"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}
              {/* Marker circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : 4}
                fill={isHovered ? 'var(--primary-blue)' : '#FFFFFF'}
                stroke="var(--primary-blue)"
                strokeWidth={isHovered ? 3 : 2}
                style={{ pointerEvents: 'none', transition: 'all 0.15s' }}
              />
            </g>
          );
        })}

        {/* Y Axis labels */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const val = Math.round((1 - ratio) * maxVal);
          const y = padding.top + ratio * (chartHeight - padding.top - padding.bottom) + 4;
          return (
            <text key={idx} x={padding.left - 10} y={y} textAnchor="end" fill="var(--text-light)" fontSize="10" fontWeight="500">
              {val}
            </text>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, idx) => {
          if (idx % Math.ceil(data.length / 6) !== 0 && idx !== data.length - 1) return null;
          const pt = getCoords(idx, 0);
          return (
            <text key={idx} x={pt.x} y={chartHeight - 10} textAnchor="middle" fill="var(--text-light)" fontSize="10" fontWeight="500">
              {d.label}
            </text>
          );
        })}
      </svg>
      <ChartTooltip {...tooltip} />
    </div>
  );
};

// ==========================================
// 2. BAR CHART (Department Workload)
// ==========================================
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

export const SVGBarChart: React.FC<BarChartProps> = ({ data, height = 220 }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, label: '', value: '', visible: false });

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = 500;
  const chartHeight = height;

  const maxVal = Math.max(...data.map(d => d.value), 1) * 1.15;
  const barCount = data.length;

  const chartInnerWidth = chartWidth - padding.left - padding.right;
  const chartInnerHeight = chartHeight - padding.top - padding.bottom;
  
  const barWidth = (chartInnerWidth / barCount) * 0.6;
  const gapWidth = (chartInnerWidth / barCount) * 0.4;

  const handleMouseMove = (index: number, e: React.MouseEvent, xCoord: number, yCoord: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipX = xCoord * (rect.width / chartWidth);
    const tooltipY = yCoord * (rect.height / chartHeight);

    setHoverIndex(index);
    setTooltip({
      x: tooltipX,
      y: tooltipY,
      label: data[index].label,
      value: `${data[index].value.toLocaleString()} Leaves`,
      visible: true
    });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%">
        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding.top + ratio * chartInnerHeight;
          return (
            <line
              key={idx}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="#EAF2FA"
              strokeWidth="1"
            />
          );
        })}

        {/* Bars */}
        {data.map((d, idx) => {
          const x = padding.left + idx * (barWidth + gapWidth) + gapWidth / 2;
          const barHeight = (d.value / maxVal) * chartInnerHeight;
          const y = chartHeight - padding.bottom - barHeight;
          const isHovered = hoverIndex === idx;
          const color = d.color || 'var(--primary-blue)';

          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="6"
                fill={color}
                opacity={isHovered ? 0.95 : 0.8}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseMove={(e) => handleMouseMove(idx, e, x + barWidth / 2, y)}
                onMouseLeave={handleMouseLeave}
              />
            </g>
          );
        })}

        {/* Y Axis labels */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const val = Math.round((1 - ratio) * maxVal);
          const y = padding.top + ratio * chartInnerHeight + 4;
          return (
            <text key={idx} x={padding.left - 10} y={y} textAnchor="end" fill="var(--text-light)" fontSize="10" fontWeight="500">
              {val}
            </text>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, idx) => {
          const x = padding.left + idx * (barWidth + gapWidth) + gapWidth / 2 + barWidth / 2;
          return (
            <text key={idx} x={x} y={chartHeight - 10} textAnchor="middle" fill="var(--text-light)" fontSize="9" fontWeight="600">
              {d.label}
            </text>
          );
        })}
      </svg>
      <ChartTooltip {...tooltip} />
    </div>
  );
};

// ==========================================
// 3. DONUT CHART (Category / Status)
// ==========================================
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
}

export const SVGDonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const size = 180;
  const radius = 64;
  const strokeWidth = 18;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  let accumulatedAngle = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total === 0 ? (
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
          ) : (
            data.map((d, idx) => {
              const percentage = d.value / total;
              const strokeDasharray = `${percentage * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedAngle;
              accumulatedAngle += percentage * circumference;

              const isHovered = hoverIndex === idx;

              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              );
            })
          )}
          {/* Inner Text summary */}
          <g transform={`translate(${center}, ${center})`} style={{ pointerEvents: 'none' }}>
            <text textAnchor="middle" y="-4" fontSize="11" fontWeight="600" fill="var(--text-light)" style={{ textTransform: 'uppercase' }} letterSpacing="0.5">
              Total
            </text>
            <text textAnchor="middle" y="16" fontSize="20" fontWeight="700" fill="var(--text-main)">
              {total}
            </text>
          </g>
        </svg>
      </div>

      {/* Legend Block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minWidth: '150px' }}>
        {data.map((d, idx) => {
          const isHovered = hoverIndex === idx;
          const percentage = total > 0 ? ((d.value / total) * 100).toFixed(0) : '0';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                opacity: hoverIndex !== null && !isHovered ? 0.4 : 1,
                transition: 'opacity 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: d.color, flexShrink: 0 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '1.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: isHovered ? 600 : 500 }}>{d.label}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{d.value} ({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
