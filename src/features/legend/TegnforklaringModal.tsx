import React from 'react'
import { Modal } from '../../components/modal/Modal'
import { symbolCategories, getSymbolsByColumn, MapSymbol } from '../../data/symbols'

interface TegnforklaringModalProps {
  isOpen: boolean
  onClose: () => void
}

const renderSymbolVisual = (symbol: MapSymbol) => {
  const { visual } = symbol
  const size = '24px'

  const commonStyles: React.CSSProperties = {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    flexShrink: 0
  }

  switch (visual.type) {
    case 'line':
      return (
        <div style={commonStyles}>
          <div
            style={{
              width: '80%',
              height: visual.lineWidth ? `${Math.max(1, parseInt(visual.lineWidth) / 2)}px` : '2px',
              backgroundColor: visual.style === 'dashed' || visual.style === 'dotted'
                ? 'transparent'
                : visual.rgb ? `rgb(${visual.rgb.join(',')})` : '#000',
              backgroundImage: visual.style === 'dashed'
                ? `repeating-linear-gradient(to right, rgb(${visual.rgb?.join(',') || '0,0,0'}) 0, rgb(${visual.rgb?.join(',') || '0,0,0'}) 3px, transparent 3px, transparent 6px)`
                : visual.style === 'dotted'
                ? `repeating-linear-gradient(to right, rgb(${visual.rgb?.join(',') || '0,0,0'}) 0, rgb(${visual.rgb?.join(',') || '0,0,0'}) 1px, transparent 1px, transparent 3px)`
                : visual.pattern === 'railway-single'
                ? `repeating-linear-gradient(to right, transparent 0, transparent 2px, rgb(${visual.rgb?.join(',') || '0,0,0'}) 2px, rgb(${visual.rgb?.join(',') || '0,0,0'}) 3px)`
                : visual.pattern === 'railway-multi'
                ? `repeating-linear-gradient(to right, transparent 0, transparent 1px, rgb(${visual.rgb?.join(',') || '0,0,0'}) 1px, rgb(${visual.rgb?.join(',') || '0,0,0'}) 2px, transparent 2px, transparent 3px)`
                : visual.pattern === 'parallel'
                ? `repeating-linear-gradient(to right, rgb(${visual.rgb?.join(',') || '0,0,0'}) 0, rgb(${visual.rgb?.join(',') || '0,0,0'}) 1px, transparent 1px, transparent 2px)`
                : undefined
            }}
          />
        </div>
      )

    case 'fill':
      return (
        <div style={{
          ...commonStyles,
          backgroundColor: visual.backgroundColor ? `rgb(${visual.backgroundColor.join(',')})` : '#ddd',
          border: visual.rgb ? `1px solid rgb(${visual.rgb.join(',')})` : '1px solid #999',
          ...(visual.pattern === 'dots' && {
            backgroundImage: `radial-gradient(circle at 3px 3px, rgba(0,0,0,0.3) 1px, transparent 1px),
                             radial-gradient(circle at 8px 8px, rgba(0,0,0,0.3) 1px, transparent 1px)`,
            backgroundSize: '12px 12px'
          })
        }} />
      )

    case 'point':
      return (
        <div style={commonStyles}>
          {visual.pattern === 'rocks' ? (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundImage: `radial-gradient(circle at 3px 3px, rgb(${visual.rgb?.join(',') || '100,100,100'}) 1px, transparent 1px),
                               radial-gradient(circle at 8px 8px, rgb(${visual.rgb?.join(',') || '100,100,100'}) 1px, transparent 1px),
                               radial-gradient(circle at 15px 5px, rgb(${visual.rgb?.join(',') || '100,100,100'}) 1px, transparent 1px)`,
              backgroundSize: '18px 12px'
            }} />
          ) : visual.shape === 'circle' ? (
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: visual.rgb ? `rgb(${visual.rgb.join(',')})` : '#000'
            }} />
          ) : (
            <div style={{
              width: '4px',
              height: '4px',
              backgroundColor: visual.rgb ? `rgb(${visual.rgb.join(',')})` : '#000'
            }} />
          )}
        </div>
      )

    case 'symbol': {
      const bgColor = visual.backgroundColor ? `rgb(${visual.backgroundColor.join(',')})` : undefined
      const textColor = visual.rgb ? `rgb(${visual.rgb.join(',')})` : '#000'

      return (
        <div style={commonStyles}>
          {visual.shape === 'square' ? (
            <div style={{
              width: '10px',
              height: '10px',
              backgroundColor: bgColor || textColor,
              border: bgColor ? `1px solid ${textColor}` : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '5px',
              color: bgColor ? textColor : '#fff'
            }} />
          ) : visual.shape === 'circle' ? (
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: bgColor || textColor,
              border: bgColor ? `1px solid ${textColor}` : undefined
            }} />
          ) : visual.shape === 'triangle' ? (
            <div style={{
              width: '0',
              height: '0',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: `6px solid ${textColor}`
            }} />
          ) : (
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: textColor
            }} />
          )}
        </div>
      )
    }

    default:
      return (
        <div style={commonStyles}>
          <div style={{
            width: '3px',
            height: '3px',
            backgroundColor: visual.rgb ? `rgb(${visual.rgb.join(',')})` : '#000'
          }} />
        </div>
      )
  }
}

const renderCategoryHeader = (categoryKey: string) => {
  const category = symbolCategories[categoryKey as keyof typeof symbolCategories]
  return (
    <div style={{
      marginBottom: '12px',
      marginTop: '24px',
      paddingBottom: '8px',
      borderBottom: '2px solid #e5e7eb'
    }}>
      <h3 style={{
        margin: 0,
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#111827',
        textTransform: 'uppercase'
      }}>
        {category.name}
      </h3>
    </div>
  )
}

const renderSymbolsByCategory = (symbols: MapSymbol[]) => {
  const categorizedSymbols = symbols.reduce((acc, symbol) => {
    if (!acc[symbol.category]) {
      acc[symbol.category] = []
    }
    acc[symbol.category].push(symbol)
    return acc
  }, {} as Record<string, MapSymbol[]>)

  return Object.entries(categorizedSymbols).map(([categoryKey, categorySymbols]) => (
    <div key={categoryKey} style={{ marginBottom: '32px' }}>
      {renderCategoryHeader(categoryKey)}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {categorySymbols.map((symbol) => (
          <div key={symbol.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '6px 0'
          }}>
            {renderSymbolVisual(symbol)}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827'
              }}>
                {symbol.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))
}

export const TegnforklaringModal: React.FC<TegnforklaringModalProps> = ({ isOpen, onClose }) => {
  const leftColumnSymbols = getSymbolsByColumn('left').sort((a, b) => a.order - b.order)
  const rightColumnSymbols = getSymbolsByColumn('right').sort((a, b) => a.order - b.order)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tegnforklaring"
      ariaLabelledBy="tegnforklaring-title"
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
        gap: '32px'
      }}>
        {/* Left Column */}
        <div>
          {renderSymbolsByCategory(leftColumnSymbols)}
        </div>

        {/* Right Column */}
        <div>
          {renderSymbolsByCategory(rightColumnSymbols)}
        </div>
      </div>
    </Modal>
  )
}