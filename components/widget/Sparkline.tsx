import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { useId, useMemo, useRef, useEffect, useState } from "react";

interface SparklineProps {
  data: number[];
  className?: string;
  "aria-label"?: string;
  isLive?: boolean;
  reducedMotion?: boolean;
}

export default function Sparkline({
  data,
  className,
  isLive = false,
  reducedMotion = false,
  ...rest
}: SparklineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, []);

  const path = useMemo(() => {
    if (data.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      return null;
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const x = scaleLinear().domain([0, data.length - 1]).range([0, dimensions.width]);
    const y = scaleLinear().domain([min, max]).range([dimensions.height - 2, 2]);
    const l = line<number>()
      .x((_, i) => x(i))
      .y((value) => y(value));
    return l(data);
  }, [data, dimensions.width, dimensions.height]);

  const strokeColor = isLive ? "var(--color-secondary)" : "var(--color-primary)";
  const uniqueId = useId();
  const gradientId = `sparkline-grad-${uniqueId}`;

  const areaPath = useMemo(() => {
    if (!path || dimensions.width === 0 || dimensions.height === 0) return null;
    return `${path} L ${dimensions.width} ${dimensions.height} L 0 ${dimensions.height} Z`;
  }, [path, dimensions.width, dimensions.height]);

  return (
    <svg
      ref={svgRef}
      role="img"
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      className={className}
      {...rest}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath ? (
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
        />
      ) : null}
      {path ? (
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isLive && !reducedMotion ? "sparkline-live-pulse" : undefined}
        />
      ) : null}
    </svg>
  );
}