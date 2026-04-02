<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content trace-modal">
      <div class="modal-header">
        <h3>访问留痕</h3>
        <button class="modal-close" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="trace-tabs">
        <button
          :class="['trace-tab', { active: activeTab === 'site' }]"
          @click="activeTab = 'site'"
        >
          网站留痕
        </button>
        <button
          :class="['trace-tab', { active: activeTab === 'url' }]"
          @click="activeTab = 'url'"
        >
          网址留痕
        </button>
      </div>

      <div class="trace-list">
        <!-- 网站留痕 -->
        <template v-if="activeTab === 'site'">
          <div v-for="group in siteGroups" :key="group.domain" class="site-group">
            <div class="site-group-header">
              <img :src="getFaviconUrl('https://' + group.domain)" class="trace-favicon" @error="handleFaviconError">
              <span>{{ group.domain }}</span>
              <span class="trace-count">{{ group.count }}次访问</span>
            </div>
            <div
              v-for="item in group.items"
              :key="item.url"
              class="trace-item"
              @click="openUrl(item.url)"
            >
              <img :src="getFaviconUrl(item.url)" class="trace-favicon" @error="handleFaviconError">
              <div class="trace-info">
                <div class="trace-title">{{ item.title || item.url }}</div>
                <div class="trace-meta">{{ formatTime(item.timestamp) }}</div>
              </div>
            </div>
          </div>
          <div v-if="siteGroups.length === 0" class="empty-state">
            <p>暂无访问记录</p>
          </div>
        </template>

        <!-- 网址留痕 -->
        <template v-else>
          <div
            v-for="item in urlList"
            :key="item.id"
            class="trace-item"
            @click="openUrl(item.url)"
          >
            <img :src="getFaviconUrl(item.url)" class="trace-favicon" @error="handleFaviconError">
            <div class="trace-info">
              <div class="trace-title">{{ item.title || item.url }}</div>
              <div class="trace-meta">{{ item.url }} · {{ formatTime(item.timestamp) }}</div>
            </div>
          </div>
          <div v-if="urlList.length === 0" class="empty-state">
            <p>暂无访问记录</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getFaviconUrl } from '@/utils/bookmark-api'
import { getTraceRecords } from '@/utils/trace-manager'

const props = defineProps({
  mode: {
    type: String,
    default: 'url'
  }
})

defineEmits(['close'])

const activeTab = ref(props.mode)
const records = ref([])

// 加载访问记录
onMounted(async () => {
  records.value = await getTraceRecords()
})

// 按网站分组
const siteGroups = computed(() => {
  const groups = {}
  for (const item of records.value) {
    if (!groups[item.domain]) {
      groups[item.domain] = {
        domain: item.domain,
        count: 0,
        items: []
      }
    }
    groups[item.domain].count++
    groups[item.domain].items.push(item)
  }
  // 按访问次数排序
  return Object.values(groups).sort((a, b) => b.count - a.count)
})

// URL列表
const urlList = computed(() => {
  return [...records.value].sort((a, b) => b.timestamp - a.timestamp)
})

// 打开URL
function openUrl(url) {
  chrome.tabs.create({ url })
}

// 格式化时间
function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'

  return date.toLocaleDateString()
}

// 处理favicon加载失败
function handleFaviconError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><circle cx="12" cy="12" r="10"/></svg>'
}
</script>

<style scoped>
.trace-count {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}
</style>