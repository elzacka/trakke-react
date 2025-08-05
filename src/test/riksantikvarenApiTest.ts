// Test script for Riksantikvaren API
import { riksantikvarenService } from '../services/riksantikvarenService'

export async function testRiksantikvarenApi() {
  console.log('🏛️ Starting Riksantikvaren API tests...')
  
  // Test 1: Check API endpoints
  await riksantikvarenService.testApiEndpoints()
  
  // Test 2: Query POIs for Setesdal region (Bykle/Valle area)
  const setesdalBbox: [number, number, number, number] = [6.8, 59.0, 8.2, 59.8]
  
  console.log('\n🗺️ Testing POI query for Setesdal region...')
  const pois = await riksantikvarenService.getHeritagePoIsInBbox(setesdalBbox)
  
  console.log(`\n📊 Results:`)
  console.log(`Total POIs found: ${pois.length}`)
  
  if (pois.length > 0) {
    // Show category breakdown
    const categories = pois.reduce((acc, poi) => {
      acc[poi.category] = (acc[poi.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('Categories:', categories)
    
    // Show first few examples
    console.log('\n📝 First 3 examples:')
    pois.slice(0, 3).forEach((poi, i) => {
      console.log(`${i + 1}. ${poi.name}`)
      console.log(`   Category: ${poi.category}`)
      console.log(`   Location: [${poi.coordinates[1]}, ${poi.coordinates[0]}]`)
      console.log(`   Description: ${poi.description.substring(0, 100)}...`)
      console.log(`   Period: ${poi.period || 'N/A'}`)
      console.log()
    })
  }
  
  return pois
}