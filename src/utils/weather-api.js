const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const PHOTON_GEOCODING_URL = 'https://photon.komoot.io/api'

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'precipitation_probability_max',
  'precipitation_sum',
  'wind_speed_10m_max',
  'wind_direction_10m_dominant',
  'uv_index_max',
  'sunrise',
  'sunset'
].join(',')

const HOURLY_FIELDS = [
  'temperature_2m',
  'precipitation',
  'precipitation_probability',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'uv_index',
  'is_day'
].join(',')

export const WEATHER_CODES = {
  0: { text: '晴', icon: '☀️' },
  1: { text: '大致晴朗', icon: '🌤️' },
  2: { text: '局部多云', icon: '⛅' },
  3: { text: '阴', icon: '☁️' },
  45: { text: '雾', icon: '🌫️' },
  48: { text: '凇雾', icon: '🌫️' },
  51: { text: '小毛毛雨', icon: '🌦️' },
  53: { text: '毛毛雨', icon: '🌦️' },
  55: { text: '大毛毛雨', icon: '🌧️' },
  56: { text: '冻毛毛雨', icon: '🌧️' },
  57: { text: '强冻毛毛雨', icon: '🌧️' },
  61: { text: '小雨', icon: '🌦️' },
  63: { text: '中雨', icon: '🌧️' },
  65: { text: '大雨', icon: '🌧️' },
  66: { text: '冻雨', icon: '🌧️' },
  67: { text: '强冻雨', icon: '🌧️' },
  71: { text: '小雪', icon: '🌨️' },
  73: { text: '中雪', icon: '🌨️' },
  75: { text: '大雪', icon: '❄️' },
  77: { text: '雪粒', icon: '❄️' },
  80: { text: '小阵雨', icon: '🌦️' },
  81: { text: '阵雨', icon: '🌧️' },
  82: { text: '强阵雨', icon: '⛈️' },
  85: { text: '小阵雪', icon: '🌨️' },
  86: { text: '强阵雪', icon: '❄️' },
  95: { text: '雷阵雨', icon: '⛈️' },
  96: { text: '雷阵雨伴冰雹', icon: '⛈️' },
  99: { text: '强雷阵雨伴冰雹', icon: '⛈️' }
}

export function weatherByCode(code) {
  return WEATHER_CODES[code] || { text: '未知', icon: '🌡️' }
}

export async function searchLocations(query, count = 8) {
  const keyword = String(query || '').trim()
  if (!keyword) return []

  const normalizedKeyword = normalizeChineseRegionQuery(keyword)
  const primaryResults = await searchOpenMeteoLocations(keyword, count)
  if (primaryResults.length > 0 && normalizedKeyword === keyword) {
    return primaryResults
  }

  const fallbackResults = await searchPhotonLocations(normalizedKeyword, count)
  return dedupeLocations([...primaryResults, ...fallbackResults]).slice(0, count)
}

async function searchOpenMeteoLocations(keyword, count) {

  const url = new URL(GEOCODING_URL)
  url.searchParams.set('name', keyword)
  url.searchParams.set('count', String(count))
  url.searchParams.set('language', 'zh')
  url.searchParams.set('format', 'json')

  const payload = await requestJson(url)
  return (payload.results || []).map((item) => ({
    id: item.id,
    label: formatLocationLabel(item),
    latitude: item.latitude,
    longitude: item.longitude,
    country: item.country,
    admin1: item.admin1,
    timezone: item.timezone
  }))
}

async function searchPhotonLocations(query, count) {
  const url = new URL(PHOTON_GEOCODING_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(count))
  url.searchParams.set('lang', 'default')

  const response = await fetch(url)
  if (!response.ok) return []

  const payload = await response.json()
  return (payload.features || [])
    .filter((feature) => feature?.geometry?.coordinates)
    .map((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates
      const item = feature.properties || {}
      return {
        id: `${item.osm_type || 'photon'}-${item.osm_id || `${latitude},${longitude}`}`,
        label: formatPhotonLocationLabel(item),
        latitude,
        longitude,
        country: item.country,
        admin1: item.state,
        timezone: ''
      }
    })
    .filter((item) => item.label)
}

function normalizeChineseRegionQuery(query) {
  const provinces = [
    '黑龙江省', '内蒙古自治区', '新疆维吾尔自治区', '宁夏回族自治区',
    '广西壮族自治区', '西藏自治区', '香港特别行政区', '澳门特别行政区',
    '北京市', '天津市', '上海市', '重庆市', '河北省', '山西省', '辽宁省',
    '吉林省', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
    '河南省', '湖北省', '湖南省', '广东省', '海南省', '四川省', '贵州省',
    '云南省', '陕西省', '甘肃省', '青海省', '台湾省'
  ]
  const shortNames = ['黑龙江', '内蒙古', '新疆', '宁夏', '广西', '西藏', '香港', '澳门', '北京', '天津', '上海', '重庆', '河北', '山西', '辽宁', '吉林', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西', '甘肃', '青海', '台湾']

  for (const province of [...provinces, ...shortNames]) {
    if (query.startsWith(province) && query.length > province.length) {
      return `${province} ${query.slice(province.length)}`
    }
  }
  return query
}

function formatPhotonLocationLabel(item) {
  const parts = [item.name, item.county, item.city, item.district, item.state, item.country]
  return Array.from(new Set(parts.filter(Boolean))).join(' · ')
}

function dedupeLocations(locations) {
  const seen = new Set()
  return locations.filter((location) => {
    const key = `${location.label}|${Number(location.latitude).toFixed(3)}|${Number(location.longitude).toFixed(3)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function getCurrentPosition() {
  if (!('geolocation' in navigator) || typeof navigator.geolocation.getCurrentPosition !== 'function') {
    throw new Error('当前浏览器不支持定位')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label: '我的位置'
      }),
      (error) => reject(new Error(describeGeolocationError(error))),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    )
  })
}

export async function getWeatherForecast(location, forecastDays = 15) {
  const latitude = Number(location?.latitude)
  const longitude = Number(location?.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('缺少有效的位置坐标')
  }

  const days = Math.min(Math.max(Number(forecastDays) || 15, 1), 16)
  const url = new URL(FORECAST_URL)
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day')
  url.searchParams.set('daily', DAILY_FIELDS)
  url.searchParams.set('hourly', HOURLY_FIELDS)
  url.searchParams.set('forecast_days', String(days))
  url.searchParams.set('timezone', 'auto')

  const payload = await requestJson(url)
  return normalizeForecast(payload, location)
}

export function normalizeForecast(payload, location) {
  if (!payload?.daily?.time || !Array.isArray(payload.daily.time)) {
    throw new Error('天气数据格式不正确')
  }

  const daily = payload.daily
  const days = daily.time.map((date, index) => ({
    date,
    code: daily.weather_code?.[index],
    weather: weatherByCode(daily.weather_code?.[index]),
    temperatureMax: daily.temperature_2m_max?.[index],
    temperatureMin: daily.temperature_2m_min?.[index],
    feelsLikeMax: daily.apparent_temperature_max?.[index],
    feelsLikeMin: daily.apparent_temperature_min?.[index],
    precipitationProbability: daily.precipitation_probability_max?.[index],
    precipitationSum: daily.precipitation_sum?.[index],
    windSpeed: daily.wind_speed_10m_max?.[index],
    windDirection: daily.wind_direction_10m_dominant?.[index],
    uvIndex: daily.uv_index_max?.[index],
    sunrise: daily.sunrise?.[index],
    sunset: daily.sunset?.[index]
  }))

  const hoursByDate = {}
  if (Array.isArray(payload.hourly?.time)) {
    payload.hourly.time.forEach((time, index) => {
      const date = time.slice(0, 10)
      if (!hoursByDate[date]) hoursByDate[date] = []
      hoursByDate[date].push({
        time,
        hour: Number(time.slice(11, 13)),
        code: payload.hourly.weather_code?.[index],
        weather: weatherByCode(payload.hourly.weather_code?.[index]),
        temperature: payload.hourly.temperature_2m?.[index],
        precipitation: payload.hourly.precipitation?.[index],
        precipitationProbability: payload.hourly.precipitation_probability?.[index],
        windSpeed: payload.hourly.wind_speed_10m?.[index],
        windDirection: payload.hourly.wind_direction_10m?.[index],
        uvIndex: payload.hourly.uv_index?.[index],
        isDay: Boolean(payload.hourly.is_day?.[index])
      })
    })
  }

  return {
    latitude: payload.latitude,
    longitude: payload.longitude,
    timezone: payload.timezone,
    currentTime: payload.current?.time,
    current: {
      code: payload.current?.weather_code,
      temperature: payload.current?.temperature_2m,
      feelsLike: payload.current?.apparent_temperature,
      humidity: payload.current?.relative_humidity_2m,
      precipitation: payload.current?.precipitation,
      weather: weatherByCode(payload.current?.weather_code),
      windSpeed: payload.current?.wind_speed_10m,
      windDirection: payload.current?.wind_direction_10m,
      isDay: Boolean(payload.current?.is_day)
    },
    days,
    hoursByDate
  }
}

function formatLocationLabel(item) {
  const parts = [item.name, item.admin1, item.country].filter(Boolean)
  return Array.from(new Set(parts)).join(' · ')
}

function describeGeolocationError(error) {
  if (error?.code === 1) return '定位权限被拒绝，请在浏览器地址栏权限中允许位置访问'
  if (error?.code === 2) return '暂时无法获取位置，请稍后重试或手动选择城市'
  if (error?.code === 3) return '定位超时，请稍后重试或手动选择城市'
  return error?.message || '定位失败'
}

async function requestJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`天气服务请求失败（${response.status}）`)
  }
  const payload = await response.json()
  if (payload?.error) {
    throw new Error(payload.reason || '天气服务返回错误')
  }
  return payload
}
