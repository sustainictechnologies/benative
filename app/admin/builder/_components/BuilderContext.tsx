'use client'

import { createContext, useContext } from 'react'

export type SelectedElement =
  | { type: 'text';  blockId: string; textKey: string }
  | { type: 'image'; blockId: string; imageKey: string }
  | { type: 'list';  blockId: string; listKey: string }

export type CellType = 'text' | 'image' | 'list' | 'empty'

export interface LayoutCell {
  id:   string
  type: CellType
}

export interface LayoutRow {
  id:    string
  cols:  1 | 2 | 3
  cells: LayoutCell[]
}

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
  addLayoutRow:           (blockId: string, cellType: 'text' | 'image' | 'list') => void
  removeLayoutRow:        (blockId: string, rowId: string) => void
  setRowCols:             (blockId: string, rowId: string, cols: 1 | 2 | 3) => void
  setCellType:            (blockId: string, rowId: string, cellId: string, type: CellType) => void
  clearCell:              (blockId: string, rowId: string, cellId: string) => void
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
  addLayoutRow:           () => {},
  removeLayoutRow:        () => {},
  setRowCols:             () => {},
  setCellType:            () => {},
  clearCell:              () => {},
})

export function useBuilder() {
  return useContext(BuilderContext)
}
