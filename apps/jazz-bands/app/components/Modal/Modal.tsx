import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useKeyPress } from '~/hooks/useKeyPress'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import {
  modalContentVariants,
  modalOverlayVariants,
} from '~/lib/animationVariants'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  overlayClassName?: string
  modalClassName?: string
}

export function Modal({
  isOpen,
  onClose,
  children,
  overlayClassName = '',
  modalClassName = '',
}: ModalProps) {
  const reducedMotion = useReducedMotion()

  useKeyPress({
    keys: ['Escape'],
    onKeyPress: onClose,
    enabled: isOpen,
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={`fixed inset-x-0 top-[64px] bottom-0 z-50 bg-slate-900/90 backdrop-blur-sm ${overlayClassName}`}
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
            onClick={handleOverlayClick}
            role="button"
            tabIndex={0}
            aria-label="Close modal overlay"
          />
          <motion.div
            className={`fixed inset-x-0 top-[64px] bottom-0 z-50 ${modalClassName}`}
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
