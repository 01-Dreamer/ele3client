<template>
  <div class="admin-page">
    <div class="admin-header">风控文本记录</div>

    <div class="filter-bar">
      <el-select v-model="filterStatus" placeholder="状态筛选" clearable size="small" @change="fetchRecords">
        <el-option label="全部" :value="undefined" />
        <el-option label="待处理" :value="0" />
        <el-option label="已处理" :value="1" />
      </el-select>
    </div>

    <el-table :data="records" border stripe size="small" v-loading="loading" @row-click="openDetail">
      <el-table-column label="时间" width="130" align="center">
        <template #default="{ row }">{{ row.createTime?.replace('T', ' ').substring(0, 19) }}</template>
      </el-table-column>
      <el-table-column label="内容" align="center">
        <template #default="{ row }">
          <span class="content-cell">{{ row.content.length > 30 ? row.content.slice(0, 30) + '...' : row.content }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="70" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">{{ row.status === 1 ? '已处理' : '待处理' }}</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        size="small" background
        v-model:current-page="currentPage"
        :page-size="pageSize" :pager-count="7"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchRecords"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="记录详情" width="90%">
      <div class="detail-row"><span>用户ID</span><p>{{ detail.userId }}</p></div>
      <div class="detail-row"><span>来源</span><p>{{ sourceLabel(detail.sourceType) }} / {{ detail.sourceId }}</p></div>
      <div class="detail-row"><span>时间</span><p>{{ detail.createTime?.replace('T', ' ')?.substring(0, 19) }}</p></div>
      <div class="detail-row"><span>内容</span><p>{{ detail.content }}</p></div>
      <div v-if="detail.status === 1" class="detail-row">
        <span>处理意见</span><p>{{ detail.handleOpinion || '已处理' }}</p>
      </div>
      <div v-if="detail.status === 0" class="handle-area">
        <el-input v-model="handleOpinion" type="textarea" :rows="2" placeholder="处理意见..." size="small" />
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="detail.status === 0" type="primary" size="small" @click="handleDetail">提交处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { listRiskTextRecordsApi, handleTextRecordApi, type RiskTextRecordVO } from '@/api/risk'
import { showErrorMessage } from '@/api/http'

const records = ref<RiskTextRecordVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 15
const total = ref(0)
const filterStatus = ref<number | undefined>(undefined)

const detailVisible = ref(false)
const detail = ref<RiskTextRecordVO>({} as RiskTextRecordVO)
const handleOpinion = ref('')

const openDetail = (row: RiskTextRecordVO) => {
  detail.value = row
  handleOpinion.value = ''
  detailVisible.value = true
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const result = await listRiskTextRecordsApi({ status: filterStatus.value, page: currentPage.value, size: pageSize })
    records.value = result.records || []
    total.value = result.total || 0
  } catch (e) { showErrorMessage(e) }
  finally { loading.value = false }
}

const handleDetail = async () => {
  try {
    await handleTextRecordApi(String(detail.value.id), handleOpinion.value || '已处理')
    ElMessage.success('已处理')
    detail.value.status = 1
    detail.value.handleOpinion = handleOpinion.value || '已处理'
    detailVisible.value = false
    fetchRecords()
  } catch (e) { showErrorMessage(e) }
}

const sourceLabel = (t: string) => {
  const m: Record<string, string> = {
    NICKNAME: '昵称', SHOP: '店铺', SHOP_ITEM: '商品', MESSAGE: '聊天',
    REVIEW: '评价', REVIEW_REPLY: '回复', AGENT_CHAT: '智能体',
  }
  return m[t] || t
}

onMounted(fetchRecords)
</script>

<style>
body { margin: 0; }
.admin-page { padding: 20px; font-family: sans-serif; max-width: 1000px; margin: 0 auto; }
.admin-header { height: 52px; display: flex; align-items: center; justify-content: center; background-image: linear-gradient(90deg, #0af, #0085ff); color: #fff; font-size: 20px; font-weight: 600; margin: -20px -20px 16px -20px; }
.filter-bar { margin-bottom: 12px; }
.content-cell { cursor: pointer; }
.pagination-wrap { display: flex; justify-content: center; padding: 16px 0; }
.detail-row { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
.detail-row span { color: #999; font-size: 13px; }
.detail-row p { margin: 4px 0 0; color: #333; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
.detail-row:last-child { border-bottom: none; }
.handle-area { margin-top: 10px; }
</style>
