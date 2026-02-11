/**
 * useSearchableSelect Hook
 * Encapsulates state management, filtering, and keyboard navigation
 * for searchable select components.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

interface UseSearchableSelectOptions<T extends { id: string }> {
  items: T[]
  getItemLabel: (item: T) => string
  filterFn?: (item: T, searchTerm: string) => boolean
  onSelect?: (item: T) => void
}

interface UseSearchableSelectReturn<T extends { id: string }> {
  // State
  isOpen: boolean
  searchTerm: string
  highlightedIndex: number
  filteredItems: T[]

  // Refs
  containerRef: React.RefObject<HTMLDivElement | null>
  searchInputRef: React.RefObject<HTMLInputElement | null>
  listRef: React.RefObject<HTMLUListElement | null>

  // Actions
  openDropdown: () => void
  closeDropdown: () => void
  toggleDropdown: () => void
  setSearchTerm: (term: string) => void
  selectItem: (item: T) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  highlightItem: (index: number) => void
}

export function useSearchableSelect<T extends { id: string }>({
  items,
  getItemLabel,
  filterFn,
  onSelect,
}: UseSearchableSelectOptions<T>): UseSearchableSelectReturn<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Default filter function: case-insensitive label search
  const defaultFilterFn = useCallback(
    (item: T, term: string): boolean => {
      return getItemLabel(item).toLowerCase().includes(term.toLowerCase())
    },
    [getItemLabel]
  )

  // Memoized filtered items
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items
    const filter = filterFn ?? defaultFilterFn
    return items.filter((item) => filter(item, searchTerm))
  }, [items, searchTerm, filterFn, defaultFilterFn])

  // Reset highlighted index when filtered items change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredItems])

  // Scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return

    const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
    if (highlightedElement) {
      highlightedElement.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, isOpen])

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Use setTimeout to ensure the element is rendered
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const openDropdown = useCallback(() => {
    setIsOpen(true)
    setHighlightedIndex(0)
  }, [])

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setSearchTerm('')
  }, [])

  const toggleDropdown = useCallback(() => {
    if (isOpen) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }, [isOpen, openDropdown, closeDropdown])

  const selectItem = useCallback(
    (item: T) => {
      onSelect?.(item)
      closeDropdown()
    },
    [onSelect, closeDropdown]
  )

  const highlightItem = useCallback((index: number) => {
    setHighlightedIndex(index)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          openDropdown()
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : prev
          )
          break

        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break

        case 'Enter':
          e.preventDefault()
          if (filteredItems[highlightedIndex]) {
            selectItem(filteredItems[highlightedIndex])
          }
          break

        case 'Escape':
          e.preventDefault()
          closeDropdown()
          break

        case 'Tab':
          closeDropdown()
          break

        case 'Home':
          e.preventDefault()
          setHighlightedIndex(0)
          break

        case 'End':
          e.preventDefault()
          setHighlightedIndex(filteredItems.length - 1)
          break
      }
    },
    [isOpen, filteredItems, highlightedIndex, openDropdown, closeDropdown, selectItem]
  )

  return {
    isOpen,
    searchTerm,
    highlightedIndex,
    filteredItems,
    containerRef,
    searchInputRef,
    listRef,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    setSearchTerm,
    selectItem,
    handleKeyDown,
    highlightItem,
  }
}
