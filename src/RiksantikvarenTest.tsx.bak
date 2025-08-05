// Test component for Riksantikvaren API integration
import React, { useState } from 'react'
import { testRiksantikvarenApi } from './test/riksantikvarenApiTest'
import { RiksantikvarenPOI } from './services/riksantikvarenService'

export function RiksantikvarenTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<RiksantikvarenPOI[]>([])
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🚀 Running Riksantikvaren API test...')
      const pois = await testRiksantikvarenApi()
      setResults(pois)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      console.error('❌ Test failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#2c5530' }}>🏛️ Riksantikvaren API Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runTest}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isLoading ? '#ccc' : '#2c5530',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '🔄 Testing API...' : '🧪 Run API Test'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          color: '#d32f2f',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2>📊 Test Results</h2>
          <p><strong>Total POIs found:</strong> {results.length}</p>
          
          {/* Category breakdown */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Categories:</h3>
            {Object.entries(
              results.reduce((acc, poi) => {
                acc[poi.category] = (acc[poi.category] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            ).map(([category, count]) => (
              <div key={category} style={{ marginBottom: '4px' }}>
                <strong>{category}:</strong> {count}
              </div>
            ))}
          </div>

          {/* Sample POIs */}
          <div>
            <h3>Sample POIs:</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {results.slice(0, 5).map((poi, index) => (
                <div
                  key={poi.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <h4 style={{ margin: '0 0 8px 0', color: '#2c5530' }}>
                    {index + 1}. {poi.name}
                  </h4>
                  <p><strong>Category:</strong> {poi.category}</p>
                  <p><strong>Coordinates:</strong> [{poi.coordinates[1].toFixed(4)}, {poi.coordinates[0].toFixed(4)}]</p>
                  <p><strong>Description:</strong> {poi.description}</p>
                  {poi.period && <p><strong>Period:</strong> {poi.period}</p>}
                  {poi.protection_status && <p><strong>Protection:</strong> {poi.protection_status}</p>}
                  {poi.source_url && (
                    <p>
                      <a 
                        href={poi.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#2c5530' }}
                      >
                        View on Kulturminnesøk →
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '40px', 
        padding: '16px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <p><strong>Note:</strong> This test queries the Riksantikvaren API for cultural heritage sites in the Setesdal region (Bykle/Valle area). Check the browser console for detailed API responses.</p>
        <p><strong>API Endpoint:</strong> https://husmann.ra.no/arcgis/rest/services/Husmann/Husmann/MapServer/</p>
      </div>
    </div>
  )
}

export default RiksantikvarenTest