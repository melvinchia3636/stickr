import { describe, expect, test, mock, beforeAll } from 'bun:test'

// Mock react-native-fs to prevent native module errors during Bun testing
mock.module('react-native-fs', function () {
  return {
    default: {
      downloadFile: function () {
        return {
          promise: Promise.resolve({ statusCode: 200 })
        }
      }
    }
  }
})

let fullyDecodeURIComponent: (str: string) => string

beforeAll(async function () {
  const mod = await import('../sigstickApi')
  fullyDecodeURIComponent = mod.fullyDecodeURIComponent
})

describe('fullyDecodeURIComponent tests', function () {
  test('decodes fully decoded plain strings unchanged', function () {
    const input = 'hello-world-123'
    const result = fullyDecodeURIComponent(input)
    expect(result).toBe(input)
  })

  test('decodes single URL-encoded strings', function () {
    const input = 'rFZmO7KQgXsmox3iX6vH-%E7%94%B2%E9%AD%9A%E7%8F%AD%E7%8F%AD%E5%90%83%E8%B2%A8%E7%AF%87-(sacabambaspis-%E8%96%A3%E5%8D%A1%E7%8F%AD%E7%94%B2%E9%AD%9A)-%40kal_pc'
    const expected = 'rFZmO7KQgXsmox3iX6vH-甲魚班班吃貨篇-(sacabambaspis-薣卡班甲魚)-@kal_pc'
    const result = fullyDecodeURIComponent(input)
    expect(result).toBe(expected)
  })

  test('decodes double URL-encoded strings', function () {
    const input = 'rFZmO7KQgXsmox3iX6vH-%25E7%2594%25B2%25E9%25AD%259A%25E7%258F%25AD%25E7%258F%25AD%25E5%2590%2583%25E8%25B2%25A8%25E7%25AF%2587-(sacabambaspis-%25E8%2596%25A3%25E5%258D%25A1%25E7%258F%25AD%25E7%2594%25B2%25E9%25AD%259A)-%2540kal_pc'
    const expected = 'rFZmO7KQgXsmox3iX6vH-甲魚班班吃貨篇-(sacabambaspis-薣卡班甲魚)-@kal_pc'
    const result = fullyDecodeURIComponent(input)
    expect(result).toBe(expected)
  })

  test('gracefully handles malformed percent-encoded sequences', function () {
    const input = 'rFZmO7KQgXsmox3iX6vH-%E7%94%B2%invalid%2F'
    const result = fullyDecodeURIComponent(input)
    expect(result).toBeDefined()
  })
})
