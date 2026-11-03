import { afterEach, describe, expect, it, vi } from 'vitest'
import { getWeatherForecast, normalizeForecast, searchLocations, weatherByCode } from './weather-api'

describe('weatherByCode', () => {
  it('maps known and unknown weather codes', () => {
    expect(weatherByCode(0).text).toBe('晴')
    expect(weatherByCode(95).icon).toBe('⛈️')
    expect(weatherByCode(999).text).toBe('未知')
  })
})

describe('normalizeForecast', () => {
  it('converts Open-Meteo daily arrays into report rows', () => {
    const forecast = normalizeForecast({
      latitude: 31.23,
      longitude: 121.47,
      timezone: 'Asia/Shanghai',
      current: {
        temperature_2m: 22,
        relative_humidity_2m: 64,
        apparent_temperature: 23,
        precipitation: 0,
        weather_code: 1,
        wind_speed_10m: 8,
        wind_direction_10m: 90,
        is_day: 1,
        time: '2026-11-03T20:15'
      },
      daily: {
        time: ['2026-11-03', '2026-11-04'],
        weather_code: [1, 61],
        temperature_2m_max: [24, 21],
        temperature_2m_min: [15, 13],
        precipitation_probability_max: [10, 80],
        precipitation_sum: [0, 8.2],
        wind_speed_10m_max: [10, 20],
        wind_direction_10m_dominant: [45, 180],
        uv_index_max: [3, 1],
        sunrise: ['2026-11-03T06:10', '2026-11-04T06:11'],
        sunset: ['2026-11-03T17:10', '2026-11-04T17:09']
      },
      hourly: {
        time: ['2026-11-03T00:00', '2026-11-03T01:00'],
        weather_code: [1, 61],
        temperature_2m: [15, 14],
        precipitation: [0, 0.2],
        precipitation_probability: [10, 50],
        weather_code: [1, 61],
        wind_speed_10m: [8, 12],
        wind_direction_10m: [45, 90],
        uv_index: [0, 0.4],
        is_day: [0, 0]
      }
    })

    expect(forecast.current.weather.text).toBe('大致晴朗')
    expect(forecast.current.code).toBe(1)
    expect(forecast.currentTime).toBe('2026-11-03T20:15')
    expect(forecast.days).toHaveLength(2)
    expect(forecast.days[1].weather.text).toBe('小雨')
    expect(forecast.days[1].temperatureMax).toBe(21)
    expect(forecast.hoursByDate['2026-11-03']).toHaveLength(2)
    expect(forecast.hoursByDate['2026-11-03'][1].weather.text).toBe('小雨')
    expect(forecast.hoursByDate['2026-11-03'][1].code).toBe(61)
  })
})

describe('searchLocations', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns normalized geocoding results', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [{ id: 1, name: '上海', admin1: '上海', country: '中国', latitude: 31.2, longitude: 121.5 }]
      })
    })
    vi.stubGlobal('fetch', fetch)

    const results = await searchLocations('上海')
    expect(results[0].label).toContain('上海')
    expect(fetch.mock.calls[0][0].searchParams.get('name')).toBe('上海')
  })

  it('falls back to Photon for province-prefixed Chinese places such as Anhui Taihu', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          features: [{
            properties: {
              osm_type: 'R',
              osm_id: 1793664,
              name: '太湖县',
              county: '太湖县',
              state: '安徽省',
              country: '中国'
            },
            geometry: { coordinates: [116.216, 30.4699] }
          }]
        })
      })
    vi.stubGlobal('fetch', fetch)

    const results = await searchLocations('安徽太湖')
    expect(results[0].label).toContain('太湖县')
    expect(fetch.mock.calls[1][0].searchParams.get('q')).toBe('安徽 太湖')
  })
})

describe('getWeatherForecast', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests 15 days of forecast data', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ daily: { time: ['2026-11-03'] }, current: {} })
    })
    vi.stubGlobal('fetch', fetch)

    await getWeatherForecast({ latitude: 31.23, longitude: 121.47 })
    const url = fetch.mock.calls[0][0]
    expect(url.searchParams.get('forecast_days')).toBe('15')
    expect(url.searchParams.get('hourly')).toContain('uv_index')
    expect(url.searchParams.get('timezone')).toBe('auto')
  })
})
