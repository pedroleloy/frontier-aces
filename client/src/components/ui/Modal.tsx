import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  closeable?: boolean;
  width?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, closeable = true, width = 'md' }: Props) {
  const widthClass = width === 'sm' ? 'max-w-sm' : width === 'lg' ? 'max-w-3xl' : 'max-w-xl';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => closeable && onClose?.()}
          />
          <motion.div
            className={`panel relative w-full ${widthClass} max-h-[90vh] overflow-y-auto`}
            initial={{ y: 30, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 25 }}
          >
            {title && (
              <h2 className="font-display text-2xl text-bronze-200 mb-4 divider-stars text-center">
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
