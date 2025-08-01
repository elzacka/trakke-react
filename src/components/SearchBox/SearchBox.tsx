// src/components/SearchBox/SearchBox.tsx - Fikset constructor og tilgjengelighet

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
  
  // FIKSET: Opprett SearchService med useRef for å unngå re-creation
  const searchService = useRef<SearchService | null>(null)
  
  // Initialize search service on first render
  if (!searchService.current) {
    searchService.current = new SearchService()
  }
  
  const debounceTimer = useRef<NodeJS.Timeout>()
  const listboxId = `searchbox-listbox-${Math.random().toString(36).substr(2, 9)}`

  // Error boundary for search failures
  const handleSearchError = useCallback((error: Error) => {
    console.error('Søkefeil:', error)
    setError('Søket feilet. Prøv igjen.')
    setResults([])
    setIsOpen(false)
    setIsLoading(false)
    
    // Clear error after 3 seconds
    setTimeout(() => setError(null), 3000)
  }, [])

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const searchResults = await searchService.current!.search(searchQuery, pois)
      setResults(searchResults)
      setIsOpen(searchResults.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      handleSearchError(error instanceof Error ? error : new Error('Ukjent feil'))
    } finally {
      setIsLoading(false)
    }
  }, [pois, handleSearchError])

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setError(null) // Clear any previous errors

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      performSearch(value)
    }, 300) // 300ms delay
  }

  // Handle result selection
  const selectResult = useCallback((result: SearchResult, closeDropdown = true) => {
    setQuery(result.displayName)
    if (closeDropdown) {
      setIsOpen(false)
      setSelectedIndex(-1)
      inputRef.current?.blur()
    }
    onLocationSelect(result)
  }, [onLocationSelect])

  // Handle keyboard navigation
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

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  // Get icon for result type
  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'coordinates': return 'my_location'
      case 'poi': return 'place'
      case 'address': return 'home'
      case 'place': return 'location_city'
      default: return 'search'
    }
  }

  // Generate unique IDs for accessibility
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
                    {result.type === 'coordinates' ? 'Koordinater' : 
                     result.type === 'poi' ? 'POI' :
                     result.type === 'address' ? 'Adresse' : 'Sted'}
                  </span>
                  <span className="result-coords" aria-label={`Koordinater ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`}>
                    {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          <div className="search-help" role="note">
            <small>
              💡 Tips: Søk på stedsnavn, koordinater (59.123,7.456) eller POI-navn
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