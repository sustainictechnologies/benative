'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Trash2, ImageIcon } from 'lucide-react'
import { useBuilder } from './BuilderContext'
import ImagePickerModal from './ImagePickerModal'

interface Props {
  blockId: string
  imageKey: string
  defaultUrl: string
  alt?: string
  className?: string
  wrapperClassName?: string
}

export default function EditableImage({
  blockId,
  imageKey,
  defaultUrl,
  alt = '',
  className = 'w-full h-full object-cover',
  wrapperClassName = '',
}: Props) {
  const { updateImage, getImage, getText, previewMode, setSelectedElement } = useBuilder()
  const [hovered, setHovered]     = useState(false)
  const [showModal, setShowModal] = useState(false)

  const src      = getImage(blockId, imageKey, defaultUrl)
  const isCustom = src !== defaultUrl

  // Read element-specific object-fit override
  const fit = getText(blockId, `${imageKey}-fit`, '') as React.CSSProperties['objectFit'] | ''
  const fitStyle: React.CSSProperties = fit ? { objectFit: fit } : {}

  const handleWrapperClick = () => {
    setSelectedElement({ type: 'image', blockId, imageKey })
  }

  if (previewMode) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} style={fitStyle} />
    )
  }

  return (
    <>
      <div
        className={`relative group/img ${wrapperClassName}`}
        onMouseEnter={() => { setHovered(true); setSelectedElement({ type: 'image', blockId, imageKey }) }}
        onMouseLeave={() => setHovered(false)}
        onClick={handleWrapperClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={className} style={fitStyle} />

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-10 bg-black/45 flex flex-col items-center justify-center gap-2 rounded-[inherit]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 bg-white text-stone-800 text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-lg hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  <Pencil size={11} />
                  Replace
                </motion.button>

                {isCustom && (
                  <motion.button
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateImage(blockId, imageKey, null)}
                    className="flex items-center gap-1 bg-red-500 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={11} />
                  </motion.button>
                )}
              </div>

              {isCustom && (
                <span className="text-[9px] bg-brand-500 text-white px-2 py-0.5 rounded-full font-semibold">
                  Custom image
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!hovered && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/30 rounded-md flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
            <ImageIcon size={10} className="text-white" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <ImagePickerModal
            currentUrl={src}
            onConfirm={url => {
              updateImage(blockId, imageKey, url)
              setShowModal(false)
            }}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
