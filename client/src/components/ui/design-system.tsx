/**
 * DESIGN SYSTEM MÍNIMO
 * Componentes base para UI consistente e densa
 */

import React from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// SURFACE - Container base com bordas, sombra e padding
// ============================================================================
interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "flat" | "outline";
  padding?: "xs" | "sm" | "md" | "lg";
  rounded?: "sm" | "md" | "lg" | "full";
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  (
    {
      variant = "default",
      padding = "md",
      rounded = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: "bg-card border border-border shadow-sm",
      elevated: "bg-card border border-border shadow-lg",
      flat: "bg-card",
      outline: "bg-transparent border border-border",
    };

    const paddingClasses = {
      xs: "p-2",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    const roundedClasses = {
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "transition-all duration-200",
          variantClasses[variant],
          paddingClasses[padding],
          roundedClasses[rounded],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Surface.displayName = "Surface";

// ============================================================================
// PILL - Badge/tag compacta com cor de status
// ============================================================================
interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  (
    { variant = "default", size = "md", icon, className, children, ...props },
    ref
  ) => {
    const variantClasses = {
      default: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
      success: "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100",
      warning: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100",
      danger: "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
      info: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
    };

    const sizeClasses = {
      sm: "px-2 py-1 text-xs font-medium",
      md: "px-3 py-1.5 text-sm font-medium",
      lg: "px-4 py-2 text-base font-medium",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);
Pill.displayName = "Pill";

// ============================================================================
// KPI - Key Performance Indicator card
// ============================================================================
interface KPIProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  color?: "default" | "success" | "warning" | "danger" | "info";
}

export const KPI = React.forwardRef<HTMLDivElement, KPIProps>(
  (
    {
      label,
      value,
      unit,
      trend,
      icon,
      color = "default",
      className,
      ...props
    },
    ref
  ) => {
    const colorClasses = {
      default: "border-slate-200 dark:border-slate-700",
      success: "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-950",
      warning: "border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950",
      danger: "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950",
      info: "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950",
    };

    return (
      <Surface
        ref={ref}
        variant="outline"
        padding="md"
        className={cn("flex flex-col gap-2", colorClasses[color], className)}
        {...props}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          {icon && <span className="text-lg opacity-60">{icon}</span>}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {trend && (
          <div className="text-xs font-medium">
            {trend === "up" && <span className="text-green-600">↑ Subindo</span>}
            {trend === "down" && <span className="text-red-600">↓ Caindo</span>}
            {trend === "neutral" && <span className="text-slate-600">→ Estável</span>}
          </div>
        )}
      </Surface>
    );
  }
);
KPI.displayName = "KPI";

// ============================================================================
// TEAM CHIP - Compact team/player display
// ============================================================================
interface TeamChipProps extends React.HTMLAttributes<HTMLDivElement> {
  logo?: string;
  name: string;
  score?: string | number;
  status?: "home" | "away";
}

export const TeamChip = React.forwardRef<HTMLDivElement, TeamChipProps>(
  ({ logo, name, score, status, className, ...props }, ref) => {
    return (
      <Surface
        ref={ref}
        variant="flat"
        padding="sm"
        className={cn(
          "flex items-center gap-2 flex-1",
          status === "home" && "border-l-4 border-l-blue-500",
          status === "away" && "border-l-4 border-l-red-500",
          className
        )}
        {...props}
      >
        {logo && (
          <img
            src={logo}
            alt={name}
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{name}</p>
        </div>
        {score !== undefined && (
          <span className="text-lg font-bold text-nowrap">{score}</span>
        )}
      </Surface>
    );
  }
);
TeamChip.displayName = "TeamChip";

// ============================================================================
// SECTION TITLE - Seção com título e ação
// ============================================================================
interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const SectionTitle = React.forwardRef<HTMLDivElement, SectionTitleProps>(
  ({ title, subtitle, action, icon, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-start justify-between gap-4 mb-4", className)}
        {...props}
      >
        <div className="flex items-start gap-3 flex-1">
          {icon && <span className="text-xl mt-1">{icon}</span>}
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    );
  }
);
SectionTitle.displayName = "SectionTitle";

// ============================================================================
// SKELETON - Loading placeholder
// ============================================================================
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circle" | "rect";
  width?: string | number;
  height?: string | number;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = "rect",
      width = "100%",
      height = "1rem",
      className,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      text: "rounded-sm",
      circle: "rounded-full",
      rect: "rounded-md",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-slate-200 dark:bg-slate-700 animate-pulse",
          variantClasses[variant],
          className
        )}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
        }}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// ============================================================================
// TOAST - Inline notification
// ============================================================================
interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      variant = "default",
      title,
      description,
      icon,
      action,
      onClose,
      className,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: "bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100",
      success: "bg-green-100 border-green-300 text-green-900 dark:bg-green-900 dark:border-green-700 dark:text-green-100",
      warning: "bg-yellow-100 border-yellow-300 text-yellow-900 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100",
      danger: "bg-red-100 border-red-300 text-red-900 dark:bg-red-900 dark:border-red-700 dark:text-red-100",
      info: "bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100",
    };

    return (
      <Surface
        ref={ref}
        variant="outline"
        padding="md"
        className={cn(
          "flex items-start gap-3 border-l-4",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {icon && <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>}
        <div className="flex-1 min-w-0">
          {title && <p className="font-semibold text-sm">{title}</p>}
          {description && (
            <p className="text-sm opacity-90 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {action && <div>{action}</div>}
          {onClose && (
            <button
              onClick={onClose}
              className="text-lg opacity-60 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          )}
        </div>
      </Surface>
    );
  }
);
Toast.displayName = "Toast";

// ============================================================================
// GRID - Layout grid para cards
// ============================================================================
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: "xs" | "sm" | "md" | "lg";
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ cols = 3, gap = "md", className, children, ...props }, ref) => {
    const colsClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
    };

    const gapClasses = {
      xs: "gap-2",
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
    };

    return (
      <div
        ref={ref}
        className={cn("grid", colsClasses[cols], gapClasses[gap], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Grid.displayName = "Grid";

// ============================================================================
// STACK - Layout flexbox para stacking
// ============================================================================
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "col";
  gap?: "xs" | "sm" | "md" | "lg";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      direction = "col",
      gap = "md",
      align = "start",
      justify = "start",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const directionClasses = {
      row: "flex-row",
      col: "flex-col",
    };

    const gapClasses = {
      xs: "gap-2",
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
    };

    const alignClasses = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    };

    const justifyClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          directionClasses[direction],
          gapClasses[gap],
          alignClasses[align],
          justifyClasses[justify],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Stack.displayName = "Stack";
