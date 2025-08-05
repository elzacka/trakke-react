// src/test/weatherIntegrationTest.ts - Test weather integration

import { WeatherService } from '../services/weatherService'

/**
 * Test weather service integration
 */
export async function testWeatherIntegration(): Promise<void> {
  console.log('🧪 Starting weather integration test...')
  
  const weatherService = new WeatherService()
  
  // Test coordinates for Bykle/Valle area
  const testLocations = [
    { name: 'Bykle sentrum', lat: 59.3922, lng: 7.3850 },
    { name: 'Valle sentrum', lat: 59.2078, lng: 7.5456 },
    { name: 'Hovden', lat: 59.5456, lng: 7.3456 }
  ]
  
  console.log(`📍 Testing ${testLocations.length} locations...`)
  
  for (const location of testLocations) {
    try {
      console.log(`\n🌤️ Fetching weather for ${location.name}...`)
      
      const weather = await weatherService.getWeatherSummary(
        location.lat, 
        location.lng
      )
      
      if (weather) {
        console.log(`✅ ${location.name}:`)
        console.log(`   Temperature: ${weather.temperature}°C`)
        console.log(`   Description: ${weather.description}`)
        console.log(`   Symbol: ${weather.symbol} (${weather.symbolCode})`)
        console.log(`   Precipitation: ${weather.precipitation}mm`)
        console.log(`   Wind: ${weather.windSpeed} km/t`)
        console.log(`   Time: ${weather.time}`)
        
        // Test outdoor recommendation
        const recommendation = weatherService.getOutdoorRecommendation(weather)
        console.log(`   Recommendation: ${recommendation.recommendation}`)
        console.log(`   Suitable: ${recommendation.suitable}`)
        if (recommendation.warnings.length > 0) {
          console.log(`   Warnings: ${recommendation.warnings.join(', ')}`)
        }
      } else {
        console.log(`❌ No weather data available for ${location.name}`)
      }
      
      // Delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`❌ Error fetching weather for ${location.name}:`, error)
    }
  }
  
  console.log('\n🔧 Testing cache functionality...')
  
  // Test cache by requesting same location again
  const firstRequest = await weatherService.getWeatherSummary(59.3922, 7.3850)
  const secondRequest = await weatherService.getWeatherSummary(59.3922, 7.3850)
  
  if (firstRequest && secondRequest) {
    const sameTime = firstRequest.time === secondRequest.time
    console.log(`Cache test: ${sameTime ? '✅ Working' : '❌ Not working'} (same timestamp: ${sameTime})`)
  }
  
  console.log('\n🧪 Weather integration test completed!')
}

/**
 * Test error handling
 */
export async function testWeatherErrorHandling(): Promise<void> {
  console.log('🧪 Testing weather error handling...')
  
  const weatherService = new WeatherService()
  
  // Test invalid coordinates
  try {
    const result = await weatherService.getWeatherSummary(999, 999)
    console.log(`Invalid coordinates: ${result ? '❌ Should have failed' : '✅ Correctly returned null'}`)
  } catch (error) {
    console.log('✅ Invalid coordinates handled correctly:', error instanceof Error ? error.message : error)
  }
  
  // Test cache cleanup
  weatherService.clearExpiredCache()
  console.log('✅ Cache cleanup executed')
  
  console.log('🧪 Error handling test completed!')
}

/**
 * Run all weather tests
 */
export async function runWeatherTests(): Promise<void> {
  console.log('🚀 Starting comprehensive weather tests...\n')
  
  try {
    await testWeatherIntegration()
    await testWeatherErrorHandling()
    console.log('\n🎉 All weather tests completed successfully!')
  } catch (error) {
    console.error('\n💥 Weather test failed:', error)
    throw error
  }
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  const windowGlobal = window as unknown as Record<string, unknown>
  windowGlobal.runWeatherTests = runWeatherTests
  windowGlobal.testWeatherIntegration = testWeatherIntegration
  windowGlobal.testWeatherErrorHandling = testWeatherErrorHandling
}