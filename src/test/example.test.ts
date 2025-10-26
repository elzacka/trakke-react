import { describe, it, expect } from 'vitest'

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true)
  })

  it('should perform basic math operations', () => {
    expect(2 + 2).toBe(4)
    expect(10 - 5).toBe(5)
    expect(3 * 4).toBe(12)
  })

  it('should work with arrays', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(arr).toHaveLength(5)
    expect(arr).toContain(3)
  })

  it('should work with objects', () => {
    const user = { name: 'Test User', age: 30 }
    expect(user).toHaveProperty('name')
    expect(user.name).toBe('Test User')
  })
})
