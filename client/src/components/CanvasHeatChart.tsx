import { useEffect, useRef } from "react";

interface DataPoint {
  time: string;
  value: number;
}

interface CanvasHeatChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  glowColor?: string;
  animationDuration?: number;
}

export function CanvasHeatChart({
  data,
  width = 600,
  height = 300,
  color = "#0ea5e9",
  glowColor = "#22c55e",
  animationDuration = 2000,
}: CanvasHeatChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min((elapsed % animationDuration) / animationDuration, 1);

      // Limpar canvas
      ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
      ctx.fillRect(0, 0, width, height);

      // Desenhar grid
      ctx.strokeStyle = "rgba(148, 163, 184, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      // Calcular pontos visíveis
      const visiblePoints = Math.floor(data.length * progress) + 1;
      const points = data.slice(0, Math.min(visiblePoints, data.length));

      if (points.length < 2) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Normalizar valores
      const maxValue = Math.max(...data.map((p) => p.value), 100);
      const minValue = 0;

      // Desenhar área com gradiente
      const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
      gradient.addColorStop(0, `${color}40`);
      gradient.addColorStop(1, `${color}00`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(padding, height - padding);

      for (let i = 0; i < points.length; i++) {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        const y = height - padding - ((points[i].value - minValue) / (maxValue - minValue)) * chartHeight;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width - padding, height - padding);
      ctx.fill();

      // Desenhar linha com glow
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();

      for (let i = 0; i < points.length; i++) {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        const y = height - padding - ((points[i].value - minValue) / (maxValue - minValue)) * chartHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Desenhar glow effect
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let i = 0; i < points.length; i++) {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        const y = height - padding - ((points[i].value - minValue) / (maxValue - minValue)) * chartHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.shadowColor = "transparent";

      // Desenhar pontos
      for (let i = 0; i < points.length; i++) {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        const y = height - padding - ((points[i].value - minValue) / (maxValue - minValue)) * chartHeight;

        // Ponto principal
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Halo
        ctx.strokeStyle = `${color}60`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Desenhar último ponto com destaque
      if (points.length > 0) {
        const lastIdx = points.length - 1;
        const lastX = padding + (chartWidth / (data.length - 1)) * lastIdx;
        const lastY = height - padding - ((points[lastIdx].value - minValue) / (maxValue - minValue)) * chartHeight;

        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Pulso
        const pulseSize = 10 + Math.sin(elapsed / 200) * 5;
        ctx.strokeStyle = `${glowColor}80`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lastX, lastY, pulseSize, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Desenhar eixos
      ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // Desenhar labels
      ctx.fillStyle = "rgba(226, 232, 240, 0.7)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";

      for (let i = 0; i < Math.min(points.length, 5); i++) {
        const step = Math.floor(points.length / 5);
        const idx = i * step;
        if (idx < points.length) {
          const x = padding + (chartWidth / (data.length - 1)) * idx;
          ctx.fillText(points[idx].time, x, height - padding + 20);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, width, height, color, glowColor, animationDuration]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full rounded-lg"
      style={{ background: "rgba(15, 23, 42, 0.5)" }}
    />
  );
}
