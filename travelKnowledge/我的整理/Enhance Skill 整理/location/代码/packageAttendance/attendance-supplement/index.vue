<template >
  <view class="supplement-page" >
    <PageNavbar title="提交补卡申请" fallbackUrl="/pages/attendance-record/index" />

    <view class="content" >
      <view class="card type-card" >
        <text class="card-title" >补卡类型</text >
        <view class="type-grid" >
          <view v-for="item in supplementTypes" :key="item.value" class="type-item"
                :class="[{ active: selectedType === item.value }, item.value]" @tap="selectedType = item.value" >
            <text class="type-title" >{{ item.label }}</text >
            <text class="type-time" >{{ item.time }}</text >
            <image class="type-icon" :src="item.icon" mode="aspectFit" />
          </view >
        </view >
      </view >

      <view class="card form-card" >
        <view class="form-item" >
          <text class="form-label" >补卡日期:</text >
          <picker class="form-control" mode="date" :value="form.date" @change="handleDateChange" >
            <view class="input-wrap" >
              <text class="input-text" >{{ form.dateText }}</text >
              <image class="date-icon" :src="calendarIcon" mode="aspectFit" />
            </view >
          </picker >
        </view >

        <view class="form-item" >
          <text class="form-label" >补卡事由</text >
          <textarea v-model="form.reason" class="reason-textarea" placeholder="请详细填写补卡事由"
                    placeholder-class="textarea-placeholder" maxlength="200" />
        </view >

        <button :loading="isSubmitting" class="submit-button" hover-class="none" @tap="handleSubmit" >提交申请</button >
      </view >
    </view >
  </view >
</template >

<script setup >
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { attendanceReissueCreate } from '@travel/api';
import PageNavbar from '@/components/PageNavbar/index.vue';
import { getImageUrl, ImageCategory } from '@/utils/image';

const sunIcon = getImageUrl(ImageCategory.COMMON, 'sun.png');
const moonIcon = getImageUrl(ImageCategory.COMMON, 'moon.png');
const calendarIcon = getImageUrl(ImageCategory.ATTENDANCE, 'calendar.png');

const supplementTypes = [
  {
    label: '上班补卡',
    value: 'work',
    time: '08：00',
    icon: sunIcon,
  },
  {
    label: '下班补卡',
    value: 'off',
    time: '18：00',
    icon: moonIcon,
  },
];

const selectedType = ref('work');
const isSubmitting = ref(false);
const form = reactive({
  date: '2026-05-14',
  dateText: '5月14日',
  time: '',
  reason: '',
});

function formatDateText(date) {
  if (!date) return '';
  const parts = date.split('-');
  if (parts.length < 3) return date;
  const month = parts[1];
  const day = parts[2];
  return `${Number(month)}月${Number(day)}日`;
}

onLoad((options) => {
  if (options.recordTime) {
    const recordTime = decodeURIComponent(options.recordTime);
    const dateOnly = recordTime.split(' ')[0];
    form.date = dateOnly;
    form.dateText = formatDateText(dateOnly);
  }
});

function handleDateChange(event) {
  form.date = event.detail.value;
  form.dateText = formatDateText(event.detail.value);
}

async function handleSubmit() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    await attendanceReissueCreate({
      reissueType: selectedType.value === 'work' ? 1 : 2,
      recordTime: form.date,
      reason: form.reason
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
      title: error?.msg || '提交失败',
      icon: 'none'
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script >

<style scoped lang="less" >
.supplement-page {
  min-height: 100vh;
  padding-bottom: calc(38rpx + env(safe-area-inset-bottom));
  background: #f6f8fb;
  box-sizing: border-box;
}

.content {
  padding: 30rpx 30rpx 0;
  box-sizing: border-box;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  box-sizing: border-box;
}

.type-card {
  padding: 28rpx 24rpx 30rpx;
}

.card-title {
  display: block;
  color: #101010;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 42rpx;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 24rpx;
  margin-top: 28rpx;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 184rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 16rpx;
  box-sizing: border-box;
}

.type-item.active {
  background: #eef6ff;
  border-color: #0068ff;
}

.type-title {
  color: #101010;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 40rpx;
}

.type-item.active .type-title {
  color: #0068ff;
}

.type-time {
  margin-top: 14rpx;
  color: #858585;
  font-size: 26rpx;
  line-height: 36rpx;
}

.type-icon {
  width: 48rpx;
  height: 48rpx;
  margin-top: 10rpx;
}

.form-card {
  margin-top: 30rpx;
  padding: 30rpx 24rpx 28rpx;
}

.form-item+.form-item {
  margin-top: 30rpx;
}

.form-label {
  display: block;
  margin-bottom: 10rpx;
  color: #888888;
  font-size: 24rpx;
  line-height: 34rpx;
}

.form-control {
  display: block;
}

.input-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70rpx;
  padding: 0 14rpx;
  background: #ffffff;
  border: 2rpx solid #e1e1e1;
  border-radius: 4rpx;
  box-sizing: border-box;
}

.input-text,
.placeholder-text {
  color: #333333;
  font-size: 26rpx;
  line-height: 36rpx;
}
.date-icon {
  width: 26rpx;
  height: 26rpx;
}

.placeholder-text {
  color: #b6b6b6;
}

.date-icon,
.clock-icon {
  color: #666666;
  font-size: 30rpx;
  line-height: 34rpx;
}

.reason-textarea {
  width: 100%;
  height: 132rpx;
  padding: 16rpx 14rpx;
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
  margin-top: 24rpx;
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
</style >
