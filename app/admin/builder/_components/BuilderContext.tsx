'use client'

import { createContext, useContext } from 'react'

export type SelectedElement =
  | { type: 'text';  blockId: string; textKey: string }
  | { type: 'image'; blockId: string; imageKey: string }

interface BuilderContextValue {
  updateImage:            (blockId: string, imageKey: string, url: string | null) => void
  getImage:               (blockId: string, imageKey: string, defaultUrl: string) => string
  updateText:             (blockId: string, textKey: string, value: string | null) => void
  getText:                (blockId: string, textKey: string, defaultValue: string) => string
  previewMode:            boolean
  selectedElement:        SelectedElement | null
  setSelectedElement:     (el: SelectedElement | null) => void
  selectedBlockId:        string | null
  addSubTextToSelected:   () => void
  removeSubText:          (blockId: string, subTextId: string) => void
}

export const BuilderContext = createContext<BuilderContextValue>({
  updateImage:            () => {},
  getImage:               (_b, _k, d) => d,
  updateText:             () => {},
  getText:                (_b, _k, d) => d,
  previewMode:            false,
  selectedElement:        null,
  setSelectedElement:     () => {},
  selectedBlockId:        null,
  addSubTextToSelected:   () => {},
  removeSubText:          () => {},
})

export function useBuilder() {
  return useContext(BuilderContext)
}
