import type { Transition, Variants } from 'framer-motion';
import { motion, useAnimation } from 'framer-motion';
import { IconProps } from './icons';
import { useEffect } from 'preact/hooks';
import { repeat } from 'rxjs';

const BaseTransition = [0, 1]

const circleTransition: Transition = {
  duration: 0.6,
  delay: 0.1,
  opacity: { delay: 0.15 },
};

const circleVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  }
};



const RouteIcon = ({ size }: IconProps) => {
  const controls = useAnimation();

  useEffect(() => { controls.start('animate') }, [controls])

  return (
    <div
      className="cursor-pointer select-none p-2 hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-center"
      // onMouseEnter={() => controls.start('animate')}
      // onMouseLeave={() => controls.start('normal')}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={ size ?? "28" }
        height={ size ?? "28" }
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.circle
          cx="6"
          cy="19"
          r="3"
          transition={circleTransition}
          variants={circleVariants}
          animate={controls}
        />
        <motion.path
          d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"
          transition={{ duration: 1, delay: 0.5, opacity: { delay: 0.5 }, repeat: Infinity }}
          variants={{
            normal: {
              pathLength: 1,
              opacity: 1,
              pathOffset: 1,
            },
            animate: {
              pathLength: BaseTransition,
              opacity: BaseTransition,
              pathOffset: [1, 0],
            },
          }}
          animate={controls}
        />
        <motion.circle
          cx="18"
          cy="5"
          r="3"
          transition={circleTransition}
          variants={circleVariants}
          animate={controls}
        />
      </svg>
    </div>
  );
};

export { RouteIcon };
