<template >
  <view class="record-page" >
    <PageNavbar title="我的考勤记录" fallbackUrl="/packageAttendance/attendance/index" />

    <view class="page-content" >
      <view class="overview-card" >
        <view class="overview-header" >
          <text class="section-title" >考勤概览</text >
          <view class="overview-supplement-btn" @tap="handleSupplementClick" >
            <text >补卡</text >
          </view >
        </view >
        <view class="overview-body" >
          <view class="overview-item" >
            <text class="overview-label" >本月已用补卡</text >
            <view class="overview-value-row" >
              <text class="overview-num black" >{{ usedSupplementCount }}</text >
              <text class="overview-unit" >次</text >
              <image class="overview-icon" :src="calendarWhiteIcon" mode="aspectFit" />
            </view >
          </view >

          <view class="overview-divider" />

          <view class="overview-item right" >
            <text class="overview-label" >本月可用补卡</text >
            <view class="overview-value-row" >
              <text class="overview-num blue" >{{ availableSupplementCount }}</text >
              <text class="overview-unit" >次</text >
              <image class="overview-icon" :src="calendarBlueIcon" mode="aspectFit" />
            </view >
          </view >
        </view >
      </view >

      <view class="filter-card" >
        <view class="date-filter-row" >
          <picker mode="date" :value="startDate" @change="handleStartDateChange" >
            <view class="date-input" >
              <text >{{ startDate }}</text >
              <image class="date-icon" :src="calendarIcon" mode="aspectFit" />
            </view >
          </picker >
          <text class="date-separator" >至</text >
          <picker mode="date" :value="endDate" @change="handleEndDateChange" >
            <view class="date-input" >
              <text >{{ endDate }}</text >
              <image class="date-icon" :src="calendarIcon" mode="aspectFit" />
            </view >
          </picker >
        </view >

        <picker :range="statusOptions" :value="statusIndex" @change="handleStatusChange" >
          <view class="status-select" >
            <text >{{ statusOptions[statusIndex] }}</text >
            <image class="select-arrow" :src="bottomIcon" mode="aspectFit" />
          </view >
        </picker >
      </view >

      <view class="record-list" >
        <view v-for="item in records" :key="item.id || item.date" class="record-card" >
          <view class="record-header" >
            <text class="record-date" >{{ item.date }}</text >
            <view class="header-right" >
              <view v-if="!item.canSupplement" class="status-tag" :class="item.statusType" >
                <text >{{ item.status }}</text >
              </view >
              <view v-if="item.canSupplement" class="supplement-btn" >
                <text >缺卡</text >
              </view >
            </view >
          </view >

          <view class="clock-lines" >
            <view v-for="clock in item.clockList" :key="clock.label" class="clock-line" >
              <text class="clock-label" >{{ clock.label }}</text >
              <view class="clock-value-row" >
                <text class="clock-time" >{{ clock.time }}</text >
                <view class="clock-status" :class="clock.statusType" >
                  <text >{{ clock.status }}</text >
                </view >
              </view >
            </view >
          </view >
        </view >

        <view v-if="records.length" class="load-more" >
          <text >{{ finished ? '— 没有更多了 —' : loading ? '加载中...' : '上拉加载更多' }}</text >
        </view >
        <view v-else-if="!loading" class="empty-record" >
          <text >暂无考勤记录</text >
        </view >
      </view >
    </view >
  </view >
</template >

<script setup >
import { computed, onMounted, ref } from 'vue';
import { onReachBottom, onShow } from '@dcloudio/uni-app';
import { attendanceDetailPage, attendanceDetailPageTemp } from '@travel/api';
import PageNavbar from '@/components/PageNavbar/index.vue';
import { useAccountStore } from '@/store/modules/account';
import { getImageUrl, ImageCategory } from '@/utils/image';

const calendarIcon = getImageUrl(ImageCategory.ATTENDANCE, 'calendar.png');
const calendarWhiteIcon = getImageUrl(ImageCategory.ATTENDANCE, 'calendar_white.png');
const calendarBlueIcon = getImageUrl(ImageCategory.ATTENDANCE, 'calendar_blue.png');
const bottomIcon = getImageUrl(ImageCategory.COMMON, 'buttom_icon.png');

const accountStore = useAccountStore();
const monthlySupplementLimit = 3;
const availableSupplementCount = computed(() => Number(
  accountStore.loginInfo?.fillTimes ?? accountStore.loginInfo?.data?.fillTimes ?? 0,
));
const statusOptions = ['全部状态', '正常', '迟到或早退', '缺卡', '请假', '已补卡'];
const statusIndex = ref(0);
const records = ref([]);
const currentPage = ref(1);
const pageSize = 10;
const total = ref(0);
const loading = ref(false);
const finished = ref(false);
const usedSupplementCount = computed(() => Math.max(
  monthlySupplementLimit - availableSupplementCount.value,
  0,
));
const selectedStatus = computed(() => statusOptions[statusIndex.value]);

const statusTypeMap = {
  正常: 'success',
  迟到或早退: 'warning',
  迟到: 'warning',
  早退: 'warning',
  缺卡: 'danger',
  请假: 'disabled',
  未打卡: 'disabled',
  已补卡: 'success',
  默认: 'disabled',
  临时工专属: 'disabled',
};

// 在 script setup 顶部增加两个辅助函数，替换原固定日期
function getMonthStartDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

function getMonthEndDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // 下个月的第0天即为本月最后一天
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

// 替换原有的硬编码日期
const startDate = ref(getMonthStartDate());
const endDate = ref(getMonthEndDate());

function formatRecordDate(record) {
  const recordDate = record.recordTime || record.createTime || '';
  if (!recordDate) return '';

  const dateText = recordDate.split(' ')[0];
  const [year, month, day] = dateText.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekText = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];

  return `${month}月${day}日(${weekText})`;
}

function getOverallStatus(record) {
  if (record.amStatus === '默认' || record.pmStatus === '默认') {
    return '缺卡';
  }
  if (record.amStatus === '迟到_或_早退') {
    return '迟到';
  }
  if (record.pmStatus === '迟到_或_早退') {
    return '早退';
  }
  if (record.amStatus && record.amStatus !== '正常') return record.amStatus;
  if (record.pmStatus && record.pmStatus !== '正常') return record.pmStatus;
  return record.amStatus || record.pmStatus || '默认';
}

function normalizeRecord(record) {
  const overallStatus = getOverallStatus(record);

  const getClockStatus = (status, isAm) => {
    if (status === '默认') return '缺卡';
    if (status === '迟到_或_早退') {
      return isAm ? '迟到' : '早退';
    }
    return status || '默认';
  };

  const amDisplayStatus = getClockStatus(record.amStatus, true);
  const pmDisplayStatus = getClockStatus(record.pmStatus, false);

  return {
    id: record.id,
    date: formatRecordDate(record),
    recordTime: record.recordTime,
    status: overallStatus,
    rawStatus: overallStatus,
    statusType: statusTypeMap[overallStatus] || 'disabled',
    canSupplement: overallStatus === '缺卡',
    clockList: [
      {
        label: '上班打卡',
        time: record.amStatus === '已补卡' ? '08:00:00' : record.startTime || '--:--',
        status: amDisplayStatus,
        statusType: statusTypeMap[amDisplayStatus] || statusTypeMap[record.amStatus] || 'disabled',
      },
      {
        label: '下班打卡',
        time: record.pmStatus === '已补卡' ? '18:00:00' : record.endTime || '--:--',
        status: pmDisplayStatus,
        statusType: statusTypeMap[pmDisplayStatus] || statusTypeMap[record.pmStatus] || 'disabled',
      },
    ],
  };
}

function getStatusListParams() {
  if (selectedStatus.value === '全部状态') return [];
  // 缺卡对应后端的“默认”状态
  if (selectedStatus.value === '缺卡') return ['默认'];
  return [selectedStatus.value];
}

async function fetchAttendanceRecords(isRefresh = false) {
  
  if (loading.value || (!isRefresh && finished.value)) return;
  
  if (isRefresh) {
    currentPage.value = 1;
    finished.value = false;
  }
  
  loading.value = true;
  
  try {
    // 👇 判断是否为临时工，选择对应的接口
    const apiMethod = accountStore.isTempWorker
      ? attendanceDetailPageTemp
      : attendanceDetailPage;
    
    const result = await apiMethod(
      {
        statusList: getStatusListParams(),
        recordTimeForm: startDate.value,
        recordTimeTo: endDate.value,
        sortBy: 'recordTime',
        descending: true,
      },
      {
        current: currentPage.value,
        pageNumber: pageSize,
      },
      true,
    );
    
    const nextRecords = (result?.records || []).map(normalizeRecord);
    total.value = result?.total || 0;
    records.value = isRefresh ? nextRecords : records.value.concat(nextRecords);
    
    const loadedCount = records.value.length;
    if (!nextRecords.length || (total.value && loadedCount >= total.value)) {
      finished.value = true;
    } else {
      currentPage.value += 1;
    }
  } catch (error) {
    uni.showToast({
      title: error?.msg || error?.message || '获取考勤记录失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

function refreshAttendanceRecords() {
  fetchAttendanceRecords(true);
}

function handleStartDateChange(event) {
  startDate.value = event.detail.value;
  refreshAttendanceRecords();
}

function handleEndDateChange(event) {
  endDate.value = event.detail.value;
  refreshAttendanceRecords();
}

function handleStatusChange(event) {
  statusIndex.value = Number(event.detail.value);
  refreshAttendanceRecords();
}

function getYesterdayDate() {
  const today = new Date();
  today.setDate(today.getDate() - 1);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function handleSupplementClick() {
  const yesterday = getYesterdayDate();
  uni.navigateTo({
    url: `/packageAttendance/attendance-supplement/index?recordTime=${encodeURIComponent(yesterday)}`,
  });
}

onMounted(() => {
  refreshAttendanceRecords();
});

onShow(() => {
  refreshAttendanceRecords();
});

onReachBottom(() => {
  fetchAttendanceRecords();
});
</script >

<style scoped lang="less" >
.record-page {
  min-height: 100vh;
  padding-bottom: calc(42rpx + env(safe-area-inset-bottom));
  background: #f6f8fb;
  box-sizing: border-box;
}

.page-content {
  padding: 18rpx 30rpx 0;
  box-sizing: border-box;
}

.overview-card,
.filter-card,
.record-card {
  background: #ffffff;
  border-radius: 14rpx;
  box-sizing: border-box;
}

.overview-card {
  padding: 22rpx 28rpx 24rpx;
}

.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.overview-supplement-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38rpx;
  padding: 0 14rpx;
  color: #f0442f;
  font-size: 20rpx;
  line-height: 38rpx;
  background: #ffffff;
  border: 2rpx solid #f0442f;
  border-radius: 6rpx;
  box-sizing: border-box;
}

.section-title {
  display: block;
  color: #191919;
  font-family: "Microsoft YaHei UI";
  font-size: 18px;
  font-style: normal;
  font-weight: 700;
  line-height: 22px;
}

.overview-body {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}

.overview-item {
  flex: 1;
  min-width: 0;
}

.overview-item.right {
  padding-left: 56rpx;
}

.overview-label {
  display: block;
  color: #666666;
  font-family: "Microsoft YaHei UI";
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 18px;
}

.overview-value-row {
  display: flex;
  align-items: flex-end;
  height: 60rpx;
  margin-top: 2rpx;
}

.overview-num {
  font-family: "DIN";
  font-size: 20px;
  font-style: normal;
  font-weight: 700;
  line-height: 22px;
  margin-bottom: 4rpx;
}

.overview-num.black {
  color: #191919;
}

.overview-num.blue {
  color: #0052d9;
}

.overview-unit {
  margin: 0 22rpx 4rpx 4rpx;
  color: #666666;
  font-family: "Microsoft YaHei UI";
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  // line-height: 22px;
}

.overview-divider {
  width: 2rpx;
  height: 62rpx;
  background: #edf0f5;
}

.overview-icon {
  width: 60rpx;
  height: 60rpx;
  margin-left: 60rpx;
}

.filter-card {
  margin-top: 26rpx;
  padding: 24rpx 20rpx 24rpx;
}

.date-filter-row {
  display: flex;
  align-items: center;
}

.date-input,
.status-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60rpx;
  padding: 0 16rpx;
  color: #7a8089;
  font-size: 22rpx;
  border: 2rpx solid #e3e7ee;
  border-radius: 4rpx;
  box-sizing: border-box;
}

.date-input {
  width: 274rpx;
}

.date-separator {
  margin: 0 14rpx;
  color: #202328;
  font-size: 24rpx;
  line-height: 34rpx;
}

.date-icon {
  width: 26rpx;
  height: 26rpx;
}

.status-select {
  width: 100%;
  margin-top: 18rpx;
}

.select-arrow {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}

.record-list {
  margin-top: 26rpx;
}

.record-card {
  margin-bottom: 24rpx;
  padding: 24rpx 30rpx 20rpx;
  border-radius: 12rpx;
}

.record-card .clock-line + .clock-line {
  border-top: 2rpx solid #f0f2f5;
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
  padding-bottom: 14rpx;
  border-bottom: 2rpx solid #f0f2f5;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.record-date {
  color: #191919;
  font-family: "Microsoft YaHei UI";
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  line-height: 16px;
}

.status-tag {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 64rpx;
  height: 32rpx;
  padding: 4rpx 20rpx;
  font-size: 20rpx;
  line-height: 32rpx;
  text-align: center;
  border-radius: 20rpx;
  box-sizing: border-box;
}

.status-tag.success {
  color: #07b075;
  background: #edffef;
  border: 0;
}

.status-tag.danger {
  color: #f0442f;
  background: #fff6f4;
  border: 0;
}

.status-tag.warning {
  color: #f0442f;
  background: #fff6f4;
  border: 0;
}

.status-tag.disabled {
  color: #999999;
  background: #f5f5f5;
  border: 0;
}

.clock-status.disabled {
  color: #999999;
  background: #f5f5f5 !important;
  border: 0;
}

.supplement-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28rpx;
  padding: 0 20rpx;
  color: #f0442f;
  font-size: 20rpx;
  line-height: 28rpx;
  background: #fff6f4;
  border-radius: 20rpx;
  box-sizing: border-box;
}

.clock-lines {
  display: flex;
  flex-direction: column;
}

.clock-line {
  display: flex;
  flex-direction: column;
  padding: 0 0 12rpx;
}

.clock-line + .clock-line {
  padding-top: 12rpx;
}

.clock-label {
  display: block;
  margin-bottom: 2rpx;
  color: #666666;
  font-family: "Microsoft YaHei UI";
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: 14px;
}

.clock-value-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 2rpx;
}

.clock-time {
  color: #191919;
  font-family: "Microsoft YaHei UI";
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  line-height: 14px;
}

.clock-status {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 64rpx;
  height: 32rpx;
  padding: 4rpx 20rpx;
  font-size: 18rpx;
  line-height: 32rpx;
  text-align: center;
  border-radius: 20rpx;
  box-sizing: border-box;
}

.clock-status.success {
  color: #07b075;
  background: #edffef;
  border: 0;
}

.clock-status.danger {
  color: #f0442f;
  background: #fff6f4;
  border: 0;
}

.clock-status.warning {
  color: #f0442f;
  background: #fff6f4;
  border: 0;
}

.clock-status.disabled {
  color: #999999;
  background: #f0442f;
  border: 0;
}

.load-more,
.empty-record {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx 0 30rpx;
  color: #9aa1aa;
  font-size: 24rpx;
  line-height: 34rpx;
}
</style >
