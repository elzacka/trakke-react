// src/components/SearchBox/SearchBox.tsx - Fullstendig fikset versjon

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { SearchService, SearchResult } from '../../services/searchService'
import { POI } from '../../data/pois'
import './SearchBox.css'

interface SearchBoxProps {
  onLocationSelect: (result: SearchResult) => void
  pois: POI[]
  placeholder?: string
  className?: string
}

// Opprett service-instans utenfor komponenten
const searchService = new SearchService()

export function SearchBox({ 
  onLocationSelect, 
  pois, 
  placeholder = "Søk etter sted, koordinater eller utgangspunkt...",
  className = ""
}: SearchBoxProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const listboxId = `searchbox-listbox-${Math.random().toString(36).substring(2, 9)}`

  // Error handling
  const handleSearchError = useCallback((searchError: Error) => {
    console.error('Søkefeil:', searchError)
    setError('Søket feilet. Prøv igjen.')
    setResults([])
    setIsOpen(false)
    setIsLoading(false)
    
    setTimeout(() => setError(null), 3000)
  }, [])

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const searchResults = await searchService.search(searchQuery, pois)
      setResults(searchResults)
      setIsOpen(searchResults.length > 0)
      setSelectedIndex(-1)
    } catch (searchError) {
      handleSearchError(searchError instanceof Error ? searchError : new Error('Ukjent feil'))
    } finally {
      setIsLoading(false)
    }
  }, [pois, handleSearchError])

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setError(null)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  // Result selection
  const selectResult = useCallback((result: SearchResult, closeDropdown = true) => {
    setQuery(result.displayName)
    if (closeDropdown) {
      setIsOpen(false)
      setSelectedIndex(-1)
      inputRef.current?.blur()
    }
    onLocationSelect(result)
  }, [onLocationSelect])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        e.preventDefault()
        setIsOpen(true)
        setSelectedIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev <= 0 ? results.length - 1 : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          selectResult(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          e.preventDefault()
          selectResult(results[selectedIndex], false)
        }
        setIsOpen(false)
        break
    }
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedInsideResults = resultsRef.current?.contains(target)
      const clickedInsideInput = inputRef.current?.contains(target)
      
      if (!clickedInsideResults && !clickedInsideInput) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  // Clear search
  const clearSearch = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    setError(null)
    inputRef.current?.focus()
  }

  // Result icon helper
  const getResultIcon = (result: SearchResult): string => {
    const iconMap: Record<SearchResult['type'], string> = {
      coordinates: 'my_location',
      poi: 'place',
      address: 'home',
      place: 'location_city'
    }
    return iconMap[result.type] || 'search'
  }

  // Result type display name
  const getResultTypeDisplayName = (type: SearchResult['type']): string => {
    const typeNames: Record<SearchResult['type'], string> = {
      coordinates: 'Koordinater',
      poi: 'POI',
      address: 'Adresse',
      place: 'Sted'
    }
    return typeNames[type] || 'Ukjent'
  }

  // Unique ID generator
  const getResultId = (index: number) => `${listboxId}-option-${index}`

  return (
    <div className={`search-box ${className}`}>
      <div className="search-input-container">
        <span className="search-icon material-symbols-outlined" aria-hidden="true">
          search
        </span>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          placeholder={placeholder}
          className="search-input"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-owns={isOpen ? listboxId : undefined}
          aria-activedescendant={selectedIndex >= 0 ? getResultId(selectedIndex) : undefined}
          aria-autocomplete="list"
          aria-label="Søk etter steder og koordinater"
        />
        
        {isLoading && (
          <span 
            className="search-loading material-symbols-outlined"
            aria-label="Søker..."
            role="status"
          >
            refresh
          </span>
        )}
        
        {query && !isLoading && (
          <button
            onClick={clearSearch}
            className="search-clear"
            title="Tøm søk"
            aria-label="Tøm søkefeltet"
            type="button"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        )}
      </div>

      {error && (
        <div className="search-error" role="alert" aria-live="polite">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div 
          ref={resultsRef} 
          className="search-results"
          role="listbox"
          id={listboxId}
          aria-label="Søkeresultater"
        >
          {results.map((result, index) => (
            <div
              key={result.id}
              id={getResultId(index)}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => selectResult(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
              tabIndex={-1}
            >
              <span 
                className="result-icon material-symbols-outlined"
                aria-hidden="true"
              >
                {getResultIcon(result)}
              </span>
              
              <div className="result-content">
                <div className="result-name">{result.displayName}</div>
                {result.description && (
                  <div className="result-description">{result.description}</div>
                )}
                <div className="result-meta">
                  <span className="result-type">
                    {getResultTypeDisplayName(result.type)}
                  </span>
                  <span 
                    className="result-coords" 
                    aria-label={`Koordinater ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`}
                  >
                    {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          <div className="search-help" role="note">
            <small>
              💡 Klikk i kategoriboksene under for å vise på kartet.
            </small>
          </div>
        </div>
      )}

      {isOpen && results.length === 0 && !isLoading && query.trim() && !error && (
        <div ref={resultsRef} className="search-results">
          <div className="search-no-results" role="status" aria-live="polite">
            <span className="material-symbols-outlined" aria-hidden="true">search_off</span>
            <div>Ingen resultater for "{query}"</div>
            <small>Prøv stedsnavn, koordinater eller andre søkeord</small>
          </div>
        </div>
      )}
    </div>
  )
}