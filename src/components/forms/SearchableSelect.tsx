/**
 * SearchableSelect Component
 * A reusable, accessible searchable select component that replaces
 * native <select> elements where search functionality is needed.
 */

import { useTranslation } from 'react-i18next'
import { useSearchableSelect } from '../../hooks'

interface SearchableSelectProps<T extends { id: string }> {
  /** Unique identifier for the component */
  id: string
  /** Array of items to display */
  items: T[]
  /** Currently selected value (item id) */
  value: string
  /** Callback when selection changes */
  onChange: (value: string) => void
  /** Function to get the primary label for an item */
  getItemLabel: (item: T) => string
  /** Optional function to get a secondary label (e.g., artist name) */
  getItemSubLabel?: (item: T) => string
  /** Placeholder text when no item is selected */
  placeholder?: string
  /** Placeholder text for the search input */
  searchPlaceholder?: string
  /** Message shown when no items match the search */
  emptyMessage?: string
  /** Whether the select is disabled */
  disabled?: boolean
  /** Whether the items are loading */
  loading?: boolean
  /** Name attribute for form submission */
  name?: string
  /** Aria label for accessibility */
  ariaLabel?: string
  /** Custom filter function */
  filterFn?: (item: T, searchTerm: string) => boolean
}

export function SearchableSelect<T extends { id: string }>({
  id,
  items,
  value,
  onChange,
  getItemLabel,
  getItemSubLabel,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
  loading = false,
  name,
  ariaLabel,
  filterFn,
}: SearchableSelectProps<T>) {
  const { t } = useTranslation()

  const defaultPlaceholder = placeholder ?? t('searchableSelect.placeholder')
  const defaultSearchPlaceholder = searchPlaceholder ?? t('searchableSelect.search')
  const defaultEmptyMessage = emptyMessage ?? t('searchableSelect.noResults')

  // Find the currently selected item
  const selectedItem = items.find((item) => item.id === value)

  const {
    isOpen,
    searchTerm,
    highlightedIndex,
    filteredItems,
    containerRef,
    searchInputRef,
    listRef,
    toggleDropdown,
    setSearchTerm,
    selectItem,
    handleKeyDown,
    highlightItem,
  } = useSearchableSelect({
    items,
    getItemLabel,
    filterFn,
    onSelect: (item) => onChange(item.id),
  })

  const handleTriggerClick = () => {
    if (!disabled && !loading) {
      toggleDropdown()
    }
  }

  const handleItemClick = (item: T) => {
    selectItem(item)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={handleTriggerClick}
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={ariaLabel ? undefined : `${id}-label`}
        aria-label={ariaLabel}
        className={`
          select select-bordered w-full text-left flex items-center justify-between
          focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className={`truncate ${!selectedItem ? 'text-base-content/50' : ''}`}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="loading loading-spinner loading-xs" aria-hidden="true" />
              {t('common.loading')}
            </span>
          ) : selectedItem ? (
            getItemSubLabel ? (
              `${getItemLabel(selectedItem)} - ${getItemSubLabel(selectedItem)}`
            ) : (
              getItemLabel(selectedItem)
            )
          ) : (
            defaultPlaceholder
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-box shadow-lg overflow-hidden"
          role="presentation"
        >
          {/* Search Input */}
          <div className="p-2 border-b border-base-300">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={defaultSearchPlaceholder}
              className="input input-bordered input-sm w-full"
              aria-label={defaultSearchPlaceholder}
              autoComplete="off"
            />
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            aria-labelledby={id}
            className="max-h-60 overflow-y-auto py-1"
          >
            {filteredItems.length === 0 ? (
              <li className="px-4 py-3 text-base-content/50 text-center text-sm">
                {defaultEmptyMessage}
              </li>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = item.id === value
                const isHighlighted = index === highlightedIndex

                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => highlightItem(index)}
                    className={`
                      px-4 py-2 cursor-pointer transition-colors
                      ${isHighlighted ? 'bg-primary/10' : ''}
                      ${isSelected ? 'bg-primary/20 font-medium' : ''}
                      hover:bg-primary/10
                    `}
                  >
                    <div className="flex flex-col">
                      <span className="truncate">{getItemLabel(item)}</span>
                      {getItemSubLabel && (
                        <span className="text-sm text-base-content/60 truncate">
                          {getItemSubLabel(item)}
                        </span>
                      )}
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
