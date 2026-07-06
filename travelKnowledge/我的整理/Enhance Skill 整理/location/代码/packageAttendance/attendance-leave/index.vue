<template >
  <view class="leave-page" >
    <PageNavbar title="提交请假申请" />

    <view class="content" >
      <view class="form-card" >
        <view class="form-item" >
          <text class="form-label" >请假类型:</text >
          <picker class="form-control" mode="selector" :range="leaveTypes" :value="leaveTypeIndex"
                  @change="handleLeaveTypeChange" >
            <view class="input-wrap" >
              <text class="input-text" >{{ selectedLeaveType }}</text >
              <view class="select-arrow" />
            </view >
          </picker >
        </view >

        <view class="form-item" >
          <text class="form-label" >开始日期:</text >
          <view class="datetime-row" @tap="openDateTimePicker('start')" >
            <text :class="form.startDate ? 'input-text' : 'placeholder-text'" >{{ form.startDate || '年/月/日'
            }}</text >
            <image class="date-icon" :src="calendarIcon" mode="aspectFit" />
          </view >
        </view >

        <view class="form-item" >
          <text class="form-label" >开始时间:</text >
          <picker class="form-control"
                  mode="selector"
                  :range="timeDisplayOptions" 
                  :value="startTimeIndex"
                  @change="handleStartTimeChange" >
            <view class="input-wrap" >
              <text :class="startTimeIndex !== -1 ? 'input-text' : 'placeholder-text'" >
                {{ startTimeIndex !== -1 ? timeDisplayOptions[startTimeIndex] : '请选择时间' }}
              </text >
              <view class="select-arrow" />
            </view >
          </picker >
        </view >

        <view class="form-item" >
          <text class="form-label" >结束日期:</text >
          <view class="datetime-row" @tap="openDateTimePicker('end')" >
            <text :class="form.endDate ? 'input-text' : 'placeholder-text'" >{{ form.endDate || '年/月/日' }}</text >
            <image class="date-icon" :src="calendarIcon" mode="aspectFit" />
          </view >
        </view >

        <view class="form-item" >
          <text class="form-label" >结束时间:</text >
          <picker class="form-control"
                  mode="selector"
                  :range="timeDisplayOptions"   
                  :value="endTimeIndex"
                  @change="handleEndTimeChange" >
            <view class="input-wrap" >
              <text :class="endTimeIndex !== -1 ? 'input-text' : 'placeholder-text'" >
                {{ endTimeIndex !== -1 ? timeDisplayOptions[endTimeIndex] : '请选择时间' }}
              </text >
              <view class="select-arrow" />
            </view >
          </picker >
        </view >

        <view class="form-item" >
          <text class="form-label" >请假事由</text >
          <textarea v-model="form.reason" class="reason-textarea" placeholder="请详细填写请假事由"
                    placeholder-class="textarea-placeholder" maxlength="200" />
        </view >

        <button :loading="isSubmitting" class="submit-button" hover-class="none" @tap="handleSubmit" >提交申请</button >
      </view >
    </view >

    <view v-if="pickerVisible" class="picker-mask" @tap="closeDateTimePicker" >
      <view class="picker-panel" @tap.stop >
        <view class="picker-header" >
          <text class="picker-action" @tap="closeDateTimePicker" >取消</text >
          <text class="picker-title" >选择日期</text >
          <text class="picker-action primary" @tap="confirmDateTime" >确定</text >
        </view >
        <picker-view class="picker-view" :value="pickerValue" @change="handlePickerViewChange" >
          <picker-view-column >
            <view v-for="year in years" :key="year" class="picker-option" >{{ year }}年</view >
          </picker-view-column >
          <picker-view-column >
            <view v-for="month in months" :key="month" class="picker-option" >{{ month }}月</view >
          </picker-view-column >
          <picker-view-column >
            <view v-for="day in days" :key="day" class="picker-option" >{{ day }}日</view >
          </picker-view-column >
        </picker-view >
      </view >
    </view >
  </view >
</template >

<script setup >
import { computed, reactive, ref } from 'vue';
import PageNavbar from '@/components/PageNavbar/index.vue';
import { getImageUrl, ImageCategory } from '@/utils/image';
import { vacationApplyCreate } from '@travel/api';

const calendarIcon = getImageUrl(ImageCategory.ATTENDANCE, 'calendar.png');

const leaveTypes = ['事假', '年假'];
const leaveTypeIndex = ref(0);
const selectedLeaveType = computed(() => leaveTypes[leaveTypeIndex.value]);

const timeOptions = ['08:00:00', '18:00:00'];
// 新增：页面显示用的文本
const timeDisplayOptions = ['上午', '下午'];

const startTimeIndex = ref(-1);
const isSubmitting = ref(false);
const endTimeIndex = ref(-1);

const form = reactive({
  startDate: '',
  endDate: '',
  reason: '',
});

const now = new Date();
const currentYear = now.getFullYear();
const years = Array.from({ length: 6 }, (_, index) => currentYear - 1 + index);
const months = Array.from({ length: 12 }, (_, index) => index + 1);
const activeDateTimeField = ref('start');
const pickerVisible = ref(false);
const pickerValue = ref([1, now.getMonth(), now.getDate() - 1]);

const days = computed(() => {
  const year = years[pickerValue.value[0]];
  const month = months[pickerValue.value[1]];
  const total = new Date(year, month, 0).getDate();
  return Array.from({ length: total }, (_, index) => index + 1);
});

function padZero(value) {
  return String(value).padStart(2, '0');
}

function handleLeaveTypeChange(event) {
  leaveTypeIndex.value = Number(event.detail.value);
}

function handleStartTimeChange(event) {
  startTimeIndex.value = Number(event.detail.value);
}

function handleEndTimeChange(event) {
  endTimeIndex.value = Number(event.detail.value);
}

function openDateTimePicker(field) {
  activeDateTimeField.value = field;
  pickerVisible.value = true;
}

function closeDateTimePicker() {
  pickerVisible.value = false;
}

function handlePickerViewChange(event) {
  const nextValue = [...event.detail.value];
  const maxDayIndex = days.value.length - 1;
  if (nextValue[2] > maxDayIndex) {
    nextValue[2] = maxDayIndex;
  }
  pickerValue.value = nextValue;
}

function confirmDateTime() {
  const [yearIndex, monthIndex, dayIndex] = pickerValue.value;
  const value = `${years[yearIndex]}/${padZero(months[monthIndex])}/${padZero(days.value[dayIndex])}`;

  if (activeDateTimeField.value === 'start') {
    form.startDate = value;
  } else {
    form.endDate = value;
  }
  closeDateTimePicker();
}

async function handleSubmit() {
  if (!form.startDate) {
    uni.showToast({
      title: '请选择开始日期',
      icon: 'none',
    });
    return;
  }

  if (startTimeIndex.value === -1) {
    uni.showToast({
      title: '请选择开始时间',
      icon: 'none',
    });
    return;
  }

  if (!form.endDate) {
    uni.showToast({
      title: '请选择结束日期',
      icon: 'none',
    });
    return;
  }

  if (endTimeIndex.value === -1) {
    uni.showToast({
      title: '请选择结束时间',
      icon: 'none',
    });
    return;
  }
  
  if (!form.reason) {
    uni.showToast({
      title: '请填写请假事由',
      icon: 'none',
    });
    return;
  }

  const startTime = `${form.startDate.replace(/\//g, '-')} ${timeOptions[startTimeIndex.value]}`;
  const endTime = `${form.endDate.replace(/\//g, '-')} ${timeOptions[endTimeIndex.value]}`;

  try {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    await vacationApplyCreate({
      applyType: leaveTypeIndex.value + 1,
      startTime,
      endTime,
      reason: form.reason,
    });

    uni.showToast({
      title: '提交成功',
      icon: 'success',
    });

    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    uni.showToast({
      title: error?.msg || error?.message || '提交失败',
      icon: 'none',
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script >

<style scoped lang="less" >
.leave-page {
  min-height: 100vh;
  padding-bottom: calc(34rpx + env(safe-area-inset-bottom));
  background: #f6f8fb;
  box-sizing: border-box;
}

.content {
  padding: 38rpx 42rpx 0;
  box-sizing: border-box;
}

.form-card {
  padding: 40rpx 38rpx 40rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-sizing: border-box;
}

.form-item+.form-item {
  margin-top: 34rpx;
}

.form-label {
  display: block;
  margin-bottom: 12rpx;
  color: #888888;
  font-size: 24rpx;
  line-height: 34rpx;
}

.form-control {
  display: block;
}

.input-wrap,
.datetime-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70rpx;
  padding: 0 16rpx;
  background: #ffffff;
  border: 2rpx solid #e1e1e1;
  border-radius: 4rpx;
  box-sizing: border-box;
}

.date-icon {
  width: 26rpx;
  height: 26rpx;
}

.input-text,
.placeholder-text {
  color: #333333;
  font-size: 26rpx;
  line-height: 36rpx;
}

.placeholder-text {
  color: #b6b6b6;
}

.select-arrow {
  width: 16rpx;
  height: 16rpx;
  margin-right: 2rpx;
  border-right: 3rpx solid #7d7d7d;
  border-bottom: 3rpx solid #7d7d7d;
  transform: rotate(45deg) translateY(-4rpx);
  box-sizing: border-box;
}

.calendar-icon {
  color: #8f8f8f;
  font-size: 28rpx;
  line-height: 32rpx;
}

.reason-textarea {
  width: 100%;
  height: 184rpx;
  padding: 18rpx 16rpx;
  color: #333333;
  font-size: 26rpx;
  line-height: 36rpx;
  background: #ffffff;
  border: 2rpx solid #e1e1e1;
  border-radius: 4rpx;
  box-sizing: border-box;
}

.textarea-placeholder {
  color: #b6b6b6;
  font-size: 26rpx;
}

.submit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70rpx;
  margin-top: 38rpx;
  padding: 0;
  color: #ffffff;
  font-size: 26rpx;
  line-height: 70rpx;
  background: #0068ff;
  border-radius: 6rpx;
  box-sizing: border-box;
}

.submit-button::after {
  border: 0;
}

.picker-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 99;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.35);
}

.picker-panel {
  width: 100%;
  padding-bottom: env(safe-area-inset-bottom);
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  box-sizing: border-box;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
  border-bottom: 2rpx solid #f0f0f0;
  box-sizing: border-box;
}

.picker-title {
  color: #151515;
  font-size: 30rpx;
  font-weight: 700;
}

.picker-action {
  color: #777777;
  font-size: 28rpx;
}

.picker-action.primary {
  color: #0068ff;
}

.picker-view {
  width: 100%;
  height: 430rpx;
}

.picker-option {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 86rpx;
  color: #333333;
  font-size: 28rpx;
}
</style >
