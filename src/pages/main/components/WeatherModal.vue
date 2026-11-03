<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content weather-modal">
      <button class="modal-close" @click="$emit('close')">×</button>
      <h3 class="modal-title">天气预报</h3>

      <div v-if="error" class="weather-error">{{ error }}</div>

      <div v-if="forecast" class="weather-current">
        <div class="current-main">
          <WeatherIcon
            class="current-icon"
            :code="forecast.current.code"
            :night="!forecast.current.isDay"
            :size="32"
          />
          <div>
            <div class="current-temperature">{{ formatNumber(forecast.current.temperature) }}°C</div>
            <div class="current-description">
              {{ forecast.current.weather.text }} · 体感 {{ formatNumber(forecast.current.feelsLike) }}°C
            </div>
          </div>
        </div>
        <div class="current-meta">
          <span>湿度 {{ formatNumber(forecast.current.humidity) }}%</span>
          <span>风 {{ windLabel(forecast.current) }}</span>
          <span>降水 {{ formatNumber(forecast.current.precipitation) }} mm</span>
          <button class="refresh-btn" type="button" :disabled="loading" @click="refresh">刷新</button>
        </div>
      </div>

      <section v-if="forecast && selectedHours.length" class="hourly-panel">
        <div class="hourly-header">
          <h4>
            {{ weekdayLabel(selectedDate, selectedDayIndex) }} {{ formatDate(selectedDate) }}
            <span>{{ selectedDay?.weather.text }} {{ formatNumber(selectedDay?.temperatureMin) }}~{{ formatNumber(selectedDay?.temperatureMax) }}°C</span>
          </h4>
          <div class="hourly-tabs">
            <button
              v-for="tab in HOURLY_TABS"
              :key="tab.key"
              :class="{ active: hourlyMetric === tab.key }"
              type="button"
              @click="hourlyMetric = tab.key"
            >{{ tab.label }}</button>
          </div>
        </div>
        <div class="hourly-scroll">
          <div class="hourly-row">
            <div
              v-for="hour in selectedHours"
              :key="hour.time"
              class="hourly-column"
              :class="{ current: isCurrentHour(hour) }"
            >
              <div class="hourly-time">{{ hourTitle(hour) }}</div>
              <WeatherIcon
                class="hourly-icon"
                :code="hour.code"
                :night="!hour.isDay"
                :size="24"
              />
              <template v-if="hourlyMetric === 'temperature'">
                <div class="hourly-value">{{ formatNumber(hour.temperature) }}°</div>
                <div class="hourly-secondary">{{ hour.weather.text }}</div>
              </template>
              <template v-else-if="hourlyMetric === 'precipitation'">
                <div class="hourly-value precipitation">{{ formatNumber(hour.precipitationProbability) }}%</div>
                <div class="hourly-secondary">{{ formatNumber(hour.precipitation, 1) }} mm</div>
              </template>
              <template v-else-if="hourlyMetric === 'wind'">
                <div class="hourly-value">{{ formatNumber(hour.windSpeed) }}</div>
                <div class="hourly-secondary">{{ windDirection(hour.windDirection) }}</div>
              </template>
              <template v-else>
                <div class="hourly-value">{{ formatNumber(hour.uvIndex, 1) }}</div>
                <div class="hourly-secondary">{{ uvLevel(hour.uvIndex) }}</div>
              </template>
            </div>
          </div>
        </div>
      </section>

      <div v-if="forecast" class="weather-report">
        <div class="report-header">
          <div class="report-location">
            <button
              :class="{ active: showLocationPanel }"
              class="location-switch"
              type="button"
              @click="toggleLocationPanel"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/>
                <circle cx="12" cy="10" r="2.5"/>
              </svg>
              <span>{{ selectedLocation?.label || '当前位置' }}</span>
              <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            <div v-if="showLocationPanel" class="location-panel">
              <button class="location-current" type="button" :disabled="loading" @click="selectCurrentLocation">
                {{ loading && source === 'auto' ? '定位中...' : '使用当前定位' }}
              </button>
              <div class="location-section">
                <span>常用城市</span>
                <button
                  v-for="city in favoriteCities"
                  :key="`${city.label}-${city.latitude}-${city.longitude}`"
                  class="favorite-city"
                  type="button"
                  @click="selectLocation(city)"
                >
                  {{ city.label }}
                  <span class="remove-city" @click.stop="removeFavoriteCity(city)">×</span>
                </button>
              </div>
              <input
                v-model="locationQuery"
                class="location-input"
                type="search"
                placeholder="搜索城市，例如 安徽太湖"
                @input="handleSearchInput"
                @keydown.enter.prevent="selectFirstSuggestion"
              />
              <div v-if="showSuggestions" class="weather-suggestions">
                <div v-if="searching" class="suggestion-empty">搜索中...</div>
                <div v-else-if="suggestions.length === 0" class="suggestion-empty">未找到城市</div>
                <template v-else>
                  <button
                    v-for="item in suggestions"
                    :key="`${item.id}-${item.latitude}-${item.longitude}`"
                    type="button"
                    @click="selectLocation(item)"
                  >
                    {{ item.label }}
                  </button>
                </template>
              </div>
            </div>
          </div>
          <div class="report-view-switch">
            <button :class="{ active: viewMode === 'trend' }" type="button" @click="viewMode = 'trend'">趋势</button>
            <button :class="{ active: viewMode === 'list' }" type="button" @click="viewMode = 'list'">列表</button>
          </div>
        </div>
        <div v-if="viewMode === 'trend'" class="trend-scroll">
          <div class="trend-grid">
            <div class="trend-columns">
              <button
                v-for="(day, index) in reportDays"
                :key="`${day.date}-label`"
                class="trend-column"
                :class="{ today: index === 0, selected: selectedDate === day.date }"
                type="button"
                @click="selectDate(day.date)"
              >
                <span class="trend-weekday" :class="{ today: index === 0 }">{{ weekdayLabel(day.date, index) }}</span>
                <span class="trend-date">{{ formatDate(day.date) }}</span>
                <WeatherIcon
                  class="trend-icon"
                  :code="day.code"
                  :size="24"
                />
                <span class="trend-precip">
                  {{ day.precipitationProbability > 0 ? `${formatNumber(day.precipitationProbability)}%` : '' }}
                </span>
              </button>
            </div>

            <div class="trend-chart">
              <svg
                :viewBox="`0 0 ${trendChartWidth} ${TREND_CHART_HEIGHT}`"
                preserveAspectRatio="none"
                role="img"
                aria-label="温度趋势图"
              >
                <polyline class="temperature-line max" :points="maxLinePoints" />
                <polyline class="temperature-line min" :points="minLinePoints" />
                <circle
                  v-for="(point, index) in maxTemperaturePoints"
                  :key="`max-point-${reportDays[index].date}`"
                  class="temperature-point max"
                  :cx="point.x"
                  :cy="point.y"
                />
                <circle
                  v-for="(point, index) in minTemperaturePoints"
                  :key="`min-point-${reportDays[index].date}`"
                  class="temperature-point min"
                  :cx="point.x"
                  :cy="point.y"
                />
              </svg>
              <div
                v-for="(day, index) in reportDays"
                :key="`${day.date}-max-label`"
                class="trend-temperature max"
                :style="temperatureLabelStyle(index, 'max')"
              >{{ formatNumber(day.temperatureMax) }}°</div>
              <div
                v-for="(day, index) in reportDays"
                :key="`${day.date}-min-label`"
                class="trend-temperature min"
                :style="temperatureLabelStyle(index, 'min')"
              >{{ formatNumber(day.temperatureMin) }}°</div>
            </div>

            <div class="trend-columns">
              <button
                v-for="(day, index) in reportDays"
                :key="`${day.date}-wind`"
                class="trend-wind"
                :class="{ today: index === 0, selected: selectedDate === day.date }"
                type="button"
                @click="selectDate(day.date)"
              >
                {{ windDirection(day.windDirection) }} {{ formatNumber(day.windSpeed) }}
              </button>
            </div>
          </div>
        </div>

        <div v-else class="report-scroll">
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>天气</th>
                <th>温度</th>
                <th>降水</th>
                <th>风</th>
                <th>UV</th>
                <th>日出/日落</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(day, index) in forecast.days" :key="day.date" :class="{ today: index === 0 }">
                <td><button class="date-button" type="button" @click="selectDate(day.date)">
                  <div class="report-date">{{ formatDate(day.date) }}</div>
                  <div class="report-weekday">{{ weekdayLabel(day.date, index) }}</div>
                </button></td>
                <td>
                  <div class="weather-cell">
                    <WeatherIcon :code="day.code" :size="22" />
                    <span>{{ day.weather.text }}</span>
                  </div>
                </td>
                <td>
                  <div class="temperature-max">{{ formatNumber(day.temperatureMax) }}°</div>
                  <div class="temperature-min">{{ formatNumber(day.temperatureMin) }}°</div>
                </td>
                <td>
                  <div>{{ formatNumber(day.precipitationProbability) }}%</div>
                  <div class="secondary-text">{{ formatNumber(day.precipitationSum) }} mm</div>
                </td>
                <td>
                  <div>{{ formatNumber(day.windSpeed) }} km/h</div>
                  <div class="secondary-text">{{ windDirection(day.windDirection) }}</div>
                </td>
                <td>{{ formatNumber(day.uvIndex) }}</td>
                <td>
                  <div>{{ formatTime(day.sunrise) }}</div>
                  <div class="secondary-text">{{ formatTime(day.sunset) }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-else-if="!loading && !error" class="weather-empty">
        选择“定位”或搜索并选择一个城市后查看 15 天天气。
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import WeatherIcon from './WeatherIcon.vue'
import { getCurrentPosition, getWeatherForecast, searchLocations } from '@/utils/weather-api'
import { getSettings, saveSettings } from '@/utils/storage'

defineEmits(['close'])

const source = ref('auto')
const selectedLocation = ref(null)
const favoriteCities = ref([])
const locationQuery = ref('')
const suggestions = ref([])
const showLocationPanel = ref(false)
const showSuggestions = ref(false)
const searching = ref(false)
const loading = ref(false)
const error = ref('')
const forecast = ref(null)
const selectedDate = ref('')
const hourlyMetric = ref('temperature')
const viewMode = ref('trend')
const HOURLY_TABS = [
  { key: 'temperature', label: '气温' },
  { key: 'precipitation', label: '降水量' },
  { key: 'wind', label: '风力' },
  { key: 'uv', label: '紫外线' }
]
const TREND_COLUMN_WIDTH = 74
const TREND_CHART_HEIGHT = 112

let searchTimer = null

const reportDays = computed(() => forecast.value?.days.slice(0, 15) || [])
const selectedDayIndex = computed(() => reportDays.value.findIndex(day => day.date === selectedDate.value))
const selectedDay = computed(() => reportDays.value[selectedDayIndex.value])
const selectedHours = computed(() => {
  const hours = forecast.value?.hoursByDate?.[selectedDate.value] || []
  const currentHour = forecast.value?.currentTime?.slice(0, 13)
  if (!currentHour || selectedDate.value !== currentHour.slice(0, 10)) return hours
  return hours.filter(hour => hour.time >= `${currentHour}:00`)
})
const trendChartWidth = computed(() => Math.max(reportDays.value.length, 1) * TREND_COLUMN_WIDTH)
const maxTemperaturePoints = computed(() => reportDays.value.map((day, index) => ({
  x: (index + 0.5) * TREND_COLUMN_WIDTH,
  y: temperaturePoint(index).maxY
})))
const minTemperaturePoints = computed(() => reportDays.value.map((day, index) => ({
  x: (index + 0.5) * TREND_COLUMN_WIDTH,
  y: temperaturePoint(index).minY
})))
const maxLinePoints = computed(() => maxTemperaturePoints.value.map(point => `${point.x},${point.y}`).join(' '))
const minLinePoints = computed(() => minTemperaturePoints.value.map(point => `${point.x},${point.y}`).join(' '))

onMounted(async () => {
  const settings = await getSettings()
  favoriteCities.value = settings.weather.favoriteCities
  await selectCurrentLocation()
})

function toggleLocationPanel() {
  showLocationPanel.value = !showLocationPanel.value
}

function handleSearchInput() {
  clearTimeout(searchTimer)
  if (!locationQuery.value.trim()) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  searchTimer = setTimeout(searchLocation, 320)
}

async function searchLocation() {
  const keyword = locationQuery.value.trim()
  if (!keyword) return
  searching.value = true
  showSuggestions.value = true
  try {
    suggestions.value = await searchLocations(keyword)
  } catch (err) {
    error.value = err.message
    suggestions.value = []
  } finally {
    searching.value = false
  }
}

function selectFirstSuggestion() {
  if (suggestions.value.length > 0) {
    selectLocation(suggestions.value[0])
  } else {
    searchLocation()
  }
}

async function selectLocation(location) {
  selectedLocation.value = { ...location }
  locationQuery.value = ''
  showSuggestions.value = false
  source.value = 'manual'
  showLocationPanel.value = false
  addFavoriteCity(location)
  await persistWeatherSettings()
  await loadForecast()
}

async function selectCurrentLocation() {
  loading.value = true
  error.value = ''
  try {
    selectedLocation.value = await getCurrentPosition()
    source.value = 'auto'
    showLocationPanel.value = false
    await persistWeatherSettings()
    await loadForecast()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function refresh() {
  if (source.value === 'auto') {
    await selectCurrentLocation()
    return
  }
  await loadForecast()
}

async function loadForecast() {
  const location = selectedLocation.value
  if (!location) return
  loading.value = true
  error.value = ''
  try {
    forecast.value = await getWeatherForecast(location, 15)
    selectedDate.value = forecast.value.days[0]?.date || ''
  } catch (err) {
    error.value = err.message
    forecast.value = null
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  const value = new Date(`${date}T00:00:00`)
  return `${value.getMonth() + 1}/${value.getDate()}`
}

function weekdayLabel(date, index) {
  if (index === 0) return '今天'
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return labels[new Date(`${date}T00:00:00`).getDay()]
}

function formatTime(value) {
  if (!value) return '--'
  return value.slice(11, 16)
}

function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--'
  return Number(value).toFixed(digits)
}

function windLabel(value) {
  return `${windDirection(value?.windDirection)} ${formatNumber(value?.windSpeed)} km/h`
}

function windDirection(degrees) {
  if (degrees === null || degrees === undefined || Number.isNaN(Number(degrees))) return '--'
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  return directions[Math.round((Number(degrees) % 360) / 45) % 8] + '风'
}

function persistWeatherSettings() {
  return getSettings().then((settings) => {
    settings.weather = {
      source: source.value,
      location: selectedLocation.value,
      favoriteCities: favoriteCities.value
    }
    return saveSettings(settings)
  })
}

function addFavoriteCity(location) {
  if (!location?.label) return
  const key = locationKey(location)
  favoriteCities.value = favoriteCities.value.filter(city => locationKey(city) !== key)
  favoriteCities.value = [{ ...location }, ...favoriteCities.value].slice(0, 12)
}

async function removeFavoriteCity(city) {
  const key = locationKey(city)
  favoriteCities.value = favoriteCities.value.filter(item => locationKey(item) !== key)
  await persistWeatherSettings()
}

function locationKey(location) {
  return `${Number(location.latitude).toFixed(3)}|${Number(location.longitude).toFixed(3)}`
}

function selectDate(date) {
  selectedDate.value = date
}

function uvLevel(value) {
  const uv = Number(value)
  if (!Number.isFinite(uv)) return '--'
  if (uv < 3) return '最弱'
  if (uv < 6) return '弱'
  if (uv < 8) return '中等'
  if (uv < 11) return '强'
  return '很强'
}

function hourTitle(hour) {
  const currentHour = forecast.value?.currentTime?.slice(0, 13)
  if (currentHour && hour.time === `${currentHour}:00`) return '现在'
  return `${hour.hour}:00`
}

function isCurrentHour(hour) {
  return hourTitle(hour) === '现在'
}

function temperaturePoint(index) {
  const temperatures = reportDays.value.flatMap(day => [
    Number(day.temperatureMax),
    Number(day.temperatureMin)
  ]).filter(value => Number.isFinite(value))
  const lowest = Math.min(...temperatures)
  const highest = Math.max(...temperatures)
  const padding = Math.max((highest - lowest) * 0.14, 1)
  const chartTop = 28
  const chartBottom = TREND_CHART_HEIGHT - 34
  const ratio = highest === lowest ? 0.5
    : (Number(reportDays.value[index]?.temperatureMax) - lowest + padding) / (highest - lowest + padding * 2)
  const minRatio = highest === lowest ? 0.5
    : (Number(reportDays.value[index]?.temperatureMin) - lowest + padding) / (highest - lowest + padding * 2)

  return {
    x: (index + 0.5) * TREND_COLUMN_WIDTH,
    maxY: chartBottom - ratio * (chartBottom - chartTop),
    minY: chartBottom - minRatio * (chartBottom - chartTop)
  }
}

function temperatureLabelStyle(index, kind) {
  const point = temperaturePoint(index)
  return {
    left: `${(point.x / trendChartWidth.value) * 100}%`,
    top: `${kind === 'max' ? point.maxY - 28 : point.minY + 12}px`
  }
}
</script>

<style scoped>
.weather-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(1480px, 96vw);
  max-width: 1480px;
  height: min(800px, calc(100vh - 28px));
  max-height: calc(100vh - 28px);
  padding: 18px 22px 16px;
  overflow: hidden;
}

.weather-modal :deep(.modal-close) {
  position: absolute;
  top: 12px;
  right: 16px;
  width: auto;
  height: auto;
  border: none;
  background: transparent;
  color: #999;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.modal-title {
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 10px;
}

.weather-error {
  padding: 10px 12px;
  margin-bottom: 14px;
  border-radius: 8px;
  color: #b42318;
  background: #fff1f0;
  font-size: 13px;
}

.weather-current {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 10px;
  border-radius: 10px;
  background: linear-gradient(135deg, #edf4ff, #f7fbff);
}

.current-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-icon { flex-shrink: 0; }
.current-temperature { font-size: 24px; font-weight: 650; }
.current-description, .current-meta { font-size: 12px; color: #667; }
.current-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.refresh-btn {
  border: 1px solid #dbe6f5;
  border-radius: 8px;
  background: white;
  color: #4a90d9;
  padding: 6px 12px;
  cursor: pointer;
}

.refresh-btn:disabled { opacity: .65; cursor: not-allowed; }

.hourly-panel {
  border: 1px solid #eceff4;
  flex-shrink: 0;
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
}

.hourly-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #eceff4;
}

.hourly-header h4 { margin: 0; font-size: 14px; }
.hourly-header h4 span { margin-left: 10px; color: #8a93a4; font-size: 12px; font-weight: 400; }
.hourly-tabs { display: flex; gap: 4px; }
.hourly-tabs button {
  border: none;
  background: transparent;
  border-radius: 7px;
  color: #677;
  font-size: 12px;
  padding: 6px 10px;
  cursor: pointer;
}
.hourly-tabs button.active { background: #eaf3ff; color: #4a90d9; font-weight: 600; }
.hourly-scroll { overflow: hidden; }
.hourly-row { display: flex; width: 100%; }
.hourly-column { flex: 1 1 0; min-width: 0; padding: 8px 2px 9px; text-align: center; }
.hourly-column.current { background: #f6faff; }
.hourly-time { color: #778; font-size: 12px; }
.hourly-icon { display: block; margin: 6px auto; }
.hourly-value { font-size: 14px; font-weight: 600; }
.hourly-value.precipitation { color: #4a90d9; }
.hourly-secondary { margin-top: 2px; color: #8a93a4; font-size: 11px; }

.weather-report {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  border: 1px solid #eceff4;
  border-radius: 10px;
  overflow: hidden;
}

.report-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #eceff4;
}

.location-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 360px;
  border: none;
  background: transparent;
  color: #4a90d9;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.location-switch span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.location-switch .chevron { transition: transform .2s; }
.location-switch.active .chevron { transform: rotate(180deg); }

.location-panel {
  position: absolute;
  top: calc(100% + 10px);
  left: 16px;
  z-index: 20;
  width: min(420px, calc(100vw - 72px));
  padding: 14px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, .16);
}

.location-current {
  width: 100%;
  margin-bottom: 12px;
  padding: 9px 12px;
  border: 1px solid #dbe6f5;
  border-radius: 8px;
  background: #f7fbff;
  color: #4a90d9;
  font-size: 13px;
  cursor: pointer;
}

.location-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.location-section > span { width: 100%; color: #8a93a4; font-size: 12px; }

.favorite-city {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #e4e9f2;
  border-radius: 16px;
  background: #fafbfc;
  color: #333;
  padding: 6px 8px 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.remove-city {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #eef1f6;
  color: #778;
  font-size: 12px;
}

.location-input {
  width: 100%;
  padding: 9px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
}

.weather-suggestions {
  max-height: 220px;
  overflow: auto;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, .08);
}

.weather-suggestions button, .suggestion-empty {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: white;
  color: #333;
  text-align: left;
  font-size: 12px;
}

.weather-suggestions button:hover { background: #f3f7ff; }
.suggestion-empty { color: #888; }

.report-view-switch { display: inline-flex; background: #f0f2f7; border-radius: 8px; padding: 3px; }
.report-view-switch button { border: none; border-radius: 6px; background: transparent; padding: 5px 12px; color: #677; font-size: 12px; cursor: pointer; }
.report-view-switch button.active { background: white; color: #4a90d9; box-shadow: 0 1px 4px rgba(0, 0, 0, .08); }

.trend-scroll {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding-bottom: 4px;
}

.trend-grid {
  position: relative;
  width: 100%;
}

.trend-columns {
  display: grid;
  grid-template-columns: repeat(15, minmax(0, 1fr));
  position: relative;
  z-index: 2;
}

.trend-column,
.trend-wind {
  padding: 2px 2px 5px;
  text-align: center;
  border: none;
  background: transparent;
  cursor: pointer;
}

.trend-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.trend-column.today,
.trend-wind.today {
  background: #f4f9ff;
  border-radius: 10px;
}

.trend-column.selected,
.trend-wind.selected { box-shadow: inset 0 0 0 2px #b9d7fb; border-radius: 10px; }

.trend-weekday {
  color: #778;
  font-size: 12px;
}

.trend-weekday.today {
  color: #1f2937;
  font-weight: 650;
}

.trend-date,
.trend-wind {
  color: #8a93a4;
  font-size: 11px;
}

.trend-icon {
  margin-top: 6px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.trend-precip {
  min-height: 15px;
  margin-top: 2px;
  color: #4a90d9;
  font-size: 11px;
}

.trend-chart {
  position: relative;
  height: 112px;
  width: 100%;
  margin: 1px 0 4px;
}

.trend-chart svg {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: visible;
}

.temperature-line {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.temperature-line.max {
  stroke: #f59e0b;
}

.temperature-line.min {
  stroke: #94a3b8;
}

.temperature-point {
  stroke: white;
  stroke-width: 2;
}

.temperature-point.max {
  fill: #f59e0b;
}

.temperature-point.min {
  fill: #94a3b8;
}

.trend-temperature {
  position: absolute;
  z-index: 3;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 600;
}

.trend-temperature.min {
  color: #7d8798;
  font-weight: 500;
}

.report-scroll {
  flex: 1;
  min-height: 0;
  max-height: none;
  overflow: auto;
}

.weather-report table {
  width: 100%;
  border-collapse: collapse;
  min-width: 780px;
  font-size: 13px;
}

.date-button {
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.weather-report th,
.weather-report td {
  padding: 8px 10px;
  border-bottom: 1px solid #f1f3f7;
  text-align: left;
  white-space: nowrap;
}

.weather-report th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fafbfc;
  color: #677;
  font-weight: 600;
}

.weather-report tbody tr:last-child td {
  border-bottom: none;
}

.weather-report tbody tr.today {
  background: #f4f9ff;
}

.report-weekday,
.secondary-text {
  margin-top: 2px;
  color: #8a93a4;
  font-size: 11px;
}

.weather-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.temperature-max {
  font-weight: 600;
}

.temperature-min {
  color: #7d8798;
}

.weather-empty {
  margin: 20px 0;
  color: #778;
  text-align: center;
  font-size: 14px;
}

@media (max-width: 760px) {
  .weather-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .weather-current {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
