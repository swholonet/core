import { useEffect, useRef, useState, useCallback } from 'react';
import SunImage from './SunImage';
import { AssetErrorBoundary } from './AssetErrorBoundary';

interface System {
  id: number;
  name: string;
  systemType: string;
  fieldX: number;
  fieldY: number;
  planetCount: number;
  hasPlayerPlanets: boolean;
  hasOwnPlanets: boolean;
  factionName?: string;
}

interface SectorField {
  x: number;
  y: number;
  system: System | null;
  hyperlane?: {
    isHyperlane: boolean;
    laneName: string;
    laneColor: string;
    laneType: 'MAJOR' | 'MINOR' | 'TRADE';
  } | null;
}

interface LazyFieldCellProps {
  field: SectorField;
  isHovered: boolean;
  onClick: (field: SectorField) => void;
  onMouseEnter: (x: number, y: number) => void;
  onMouseLeave: () => void;
}

/**
 * Lazy-loaded field cell with Intersection Observer
 * Only renders system icons when visible in viewport
 */
function LazyFieldCell({
  field,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: LazyFieldCellProps) {
  const cellRef = useRef<HTMLTableCellElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, stop observing (lazy load once)
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: '100px', // preload 100px before visible
        threshold: 0.01, // trigger as soon as 1% visible
      }
    );

    if (cellRef.current) {
      observer.observe(cellRef.current);
    }

    return () => {
      if (cellRef.current) {
        observer.unobserve(cellRef.current);
      }
    };
  }, []);

  const handleClick = useCallback(() => {
    onClick(field);
  }, [field, onClick]);

  const handleMouseEnter = useCallback(() => {
    onMouseEnter(field.x, field.y);
  }, [field.x, field.y, onMouseEnter]);

  return (
    <td
      ref={cellRef}
      className={`border transition-all duration-200 ${
        field.system
          ? `cursor-pointer ${
              field.system.hasOwnPlanets
                ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-900/15 to-yellow-800/10'
                : field.system.factionName
                  ? 'border-red-500/40 bg-gradient-to-br from-red-900/12 to-red-800/8'
                  : 'border-cyan-500/40 bg-gradient-to-br from-cyan-900/12 to-cyan-800/8'
            } ${isHovered ? 'ring-2 ring-cyan-400/60 shadow-xl shadow-cyan-400/40 scale-110 border-cyan-400/80' : 'hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-400/20'}`
          : field.hyperlane?.isHyperlane
            ? `hyperlane-field hyperlane-${field.hyperlane.laneType.toLowerCase()} border-slate-700/20 bg-black/30`
            : 'border-slate-700/15 bg-black/40 hover:bg-slate-900/30 hover:border-slate-600/25'
      }`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      style={field.hyperlane?.isHyperlane ? { '--lane-color': field.hyperlane.laneColor } as React.CSSProperties : {}}
    >
      <div className="aspect-square w-full flex items-center justify-center relative">
        {/* Enhanced Hyperlane overlay - render behind system icons */}
        {field.hyperlane?.isHyperlane && (
          <div
            className="hyperlane-overlay absolute inset-0"
            title={field.hyperlane.laneName}
          />
        )}

        {/* Enhanced System icons - render on top of hyperlane overlays */}
        {field.system && isVisible && (
          <AssetErrorBoundary
            errorMessage={`System ${field.system.id} asset failed`}
            showDetails={false}
          >
            <div className="relative group">
              {/* System Glow Effect */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-200 ${
                  field.system.hasOwnPlanets
                    ? 'bg-yellow-400/20 shadow-lg shadow-yellow-400/40'
                    : field.system.factionName
                      ? 'bg-red-400/15 shadow-md shadow-red-400/30'
                      : 'bg-cyan-400/15 shadow-md shadow-cyan-400/30'
                } ${isHovered ? 'scale-125 opacity-80' : 'opacity-60'}`}
                style={{
                  boxShadow: field.system.hasOwnPlanets
                    ? '0 0 12px rgba(255, 215, 0, 0.4)'
                    : field.system.factionName
                      ? '0 0 8px rgba(255, 100, 100, 0.3)'
                      : '0 0 8px rgba(0, 255, 255, 0.3)'
                }}
              />
              <SunImage
                systemType={field.system.systemType}
                alt={field.system.name}
                className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-200"
                size={24}
              />
            </div>
          </AssetErrorBoundary>
        )}
        {!isVisible && field.system && (
          <div className="w-5 h-5 rounded-full bg-cyan-600/40 animate-pulse relative z-10 shadow-sm shadow-cyan-500/30" />
        )}

        {/* Coordinate Display on Hover */}
        {isHovered && (
          <div
            className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-slate-900/95 text-cyan-400 text-xs font-mono px-2 py-1 rounded-md border border-cyan-500/40 pointer-events-none z-20"
            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)' }}
          >
            {field.x},{field.y}
          </div>
        )}
      </div>
    </td>
  );
}

interface LazySectorGridProps {
  fields: SectorField[];
  fieldsPerSector: number;
  hoveredField: { x: number; y: number } | null;
  onFieldClick: (field: SectorField) => void;
  onFieldMouseEnter: (x: number, y: number) => void;
  onFieldMouseLeave: () => void;
}

/**
 * Optimized sector grid with lazy loading
 * Renders 20x20 field grid with viewport-based asset loading
 */
export default function LazySectorGrid({
  fields,
  fieldsPerSector,
  hoveredField,
  onFieldClick,
  onFieldMouseEnter,
  onFieldMouseLeave,
}: LazySectorGridProps) {
  // Create rows for table layout
  const rows: SectorField[][] = [];
  for (let y = 1; y <= fieldsPerSector; y++) {
    const row: SectorField[] = [];
    for (let x = 1; x <= fieldsPerSector; x++) {
      const field = fields.find((f) => f.x === x && f.y === y);
      if (field) {
        row.push(field);
      }
    }
    rows.push(row);
  }

  return (
    <table className="border-collapse relative z-10 sector-grid w-full table-fixed">
      <thead>
        <tr>
          <th className="text-cyan-400/70 text-xs p-2 font-mono tracking-wider bg-slate-900/50 border border-slate-700/30">x|y</th>
          {Array.from({ length: fieldsPerSector }, (_, i) => (
            <th
              key={i}
              className="text-cyan-400/70 text-xs p-2 font-mono tracking-wider bg-slate-900/50 border border-slate-700/30"
            >
              {i + 1}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            <td className="text-cyan-400/70 text-xs p-2 text-right font-mono tracking-wider bg-slate-900/50 border border-slate-700/30">
              {rowIndex + 1}
            </td>
            {row.map((field) => {
              const isHovered =
                hoveredField?.x === field.x && hoveredField?.y === field.y;

              return (
                <LazyFieldCell
                  key={`${field.x}-${field.y}`}
                  field={field}
                  isHovered={isHovered}
                  onClick={onFieldClick}
                  onMouseEnter={onFieldMouseEnter}
                  onMouseLeave={onFieldMouseLeave}
                />
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
