import { motion, AnimatePresence, Variants } from "framer-motion";
import { ReactNode } from "react";

/**
 * Variantes de Animação Orquestradas
 */

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

export const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, rotateY: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      type: "spring",
      stiffness: 100,
    },
  },
  hover: {
    scale: 1.05,
    rotateY: 5,
    boxShadow: "0 20px 40px rgba(14, 165, 233, 0.3)",
    transition: { duration: 0.3 },
  },
  tap: {
    scale: 0.95,
    rotateY: -5,
  },
};

export const tabVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: { duration: 0.3 },
  },
};

export const floatingVariants: Variants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const glowVariants: Variants = {
  animate: {
    boxShadow: [
      "0 0 10px rgba(14, 165, 233, 0.5)",
      "0 0 20px rgba(14, 165, 233, 0.8)",
      "0 0 10px rgba(14, 165, 233, 0.5)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const heatWaveVariants: Variants = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export const rotateVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

/**
 * Componentes Wrapper com Animação
 */

interface AnimatedContainerProps {
  children: ReactNode;
  staggerDelay?: number;
}

export function AnimatedContainer({ children, staggerDelay = 0.1 }: AnimatedContainerProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: staggerDelay }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
}

export function AnimatedItem({ children, delay = 0 }: AnimatedItemProps) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function AnimatedCard({ children, onClick, className = "" }: AnimatedCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedTabProps {
  children: ReactNode;
  isActive: boolean;
}

export function AnimatedTab({ children, isActive }: AnimatedTabProps) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key="tab-content"
          variants={tabVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface FloatingElementProps {
  children: ReactNode;
  duration?: number;
}

export function FloatingElement({ children, duration = 4 }: FloatingElementProps) {
  return (
    <motion.div
      animate={{
        y: [-10, 10, -10],
        transition: {
          duration,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      {children}
    </motion.div>
  );
}

interface PulsingElementProps {
  children: ReactNode;
  intensity?: number;
}

export function PulsingElement({ children, intensity = 0.1 }: PulsingElementProps) {
  return (
    <motion.div
      animate={{
        scale: [1, 1 + intensity, 1],
        opacity: [1, 0.8, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      {children}
    </motion.div>
  );
}

interface GlowingElementProps {
  children: ReactNode;
  color?: string;
}

export function GlowingElement({ children, color = "rgba(14, 165, 233, 0.5)" }: GlowingElementProps) {
  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 10px ${color}`,
          `0 0 20px ${color}`,
          `0 0 10px ${color}`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animação de Número Crescente
 */

interface CountUpProps {
  from: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

export function CountUp({ from, to, duration = 2, suffix = "", prefix = "" }: CountUpProps) {
  return (
    <motion.span>
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
      >
        {to}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

/**
 * Animação de Entrada em Cascata
 */

interface CascadeAnimationProps {
  children: ReactNode[];
  delay?: number;
}

export function CascadeAnimation({ children, delay = 0.1 }: CascadeAnimationProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: delay }}
    >
      {children.map((child, idx) => (
        <motion.div key={idx} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Animação de Página com Transição
 */

interface PageTransitionProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
}

export function PageTransition({ children, direction = "up" }: PageTransitionProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: 50, opacity: 0 };
      case "down":
        return { y: -50, opacity: 0 };
      case "left":
        return { x: 50, opacity: 0 };
      case "right":
        return { x: -50, opacity: 0 };
      default:
        return { y: 50, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={getInitialPosition()}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
