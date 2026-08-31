<template >
  <view class="attendance-page" >
    <PageNavbar title="考勤管理" theme="blue" />
    <view class="hero-section" >
      <view class="hero-content" >
        <view class="welcome-info" >
          <text class="welcome-title" >你好，{{ displayUserName }}</text >
          <text class="welcome-subtitle" >欢迎使用考勤管理系统</text >
        </view >
        <image class="calendar-image" :src="attendanceCalendar" mode="aspectFit" />
      </view >
    </view >

    <view class="content-bg" >
      <view class="content-area" >
        <!--    card1    -->
        <view class="card scan-card" >
          <view class="section-title-wrap" >
            <view class="section-mark" />
            <text class="section-title" >扫码打卡（通用）</text >
          </view >
          <text class="section-desc" >长期工与临时工均使用统一打卡码</text >

          <view class="scan-box" :class="{ 'scan-box--loading': scanLoading }" @tap="handleScanCodeTap" >
            <image class="scan-image" :src="attendanceScan" mode="aspectFit" />
            <text class="scan-text" >点击启动设备扫码打卡</text >
            <view v-if="scanLoading" class="scan-loading-mask" >
              <view class="scan-loading-spinner" />
              <text class="scan-loading-text" >打卡处理中，请稍候...</text >
            </view >
          </view >
        </view >
        <!--    card2    -->
        <view class="card action-card" >
          <view class="section-title-wrap" >
            <view class="section-mark" />
            <text class="section-title" >扫码打卡（通用）</text >
          </view >
          <view class="action-grid" >
            <template v-for="item in filteredActionItems" :key="item.title" >
              <PermissionView v-if="!accountStore.isTempWorker"
                              :code="item.permissionValue" >
                <view class="action-item"
                      :class="item.type"
                      @tap="handleActionTap(item.title)" >
                  <image class="action-icon" :src="item.icon" mode="aspectFit" />
                  <text class="action-title" >{{ item.title }}</text >
                </view >
              </PermissionView >
              <view v-else
                    class="action-item"
                    :class="item.type"
                    @tap="handleActionTap(item.title)" >
                <image class="action-icon" :src="item.icon" mode="aspectFit" />
                <text class="action-title" >{{ item.title }}</text >
              </view >
            </template >
          </view >
        
        </view >
        <!--    card3    -->
        <view v-if="!accountStore.isTempWorker" class="card action-card" >
          <view class="section-title-wrap" >
            <view class="section-mark" />
            <text class="section-title" >使用车辆</text >
          </view >
          <AttendanceLocationSelector :personalName="displayUserName"
                                      :isTempWorker="accountStore.isTempWorker"
                                      :selectedVehicle="selectedVehicle"
                                      :vehicleActive="vehicleActive"
                                      :approvalStatus="vehicleApprovalStatus"
                                      :submitting="vehicleSubmitting"
                                      @submitVehicle="handleSubmitVehicle"
                                      @closeVehicle="handleCloseVehicle" />
        </view >
      </view >
    </view >
  </view >
</template >

<script setup >
import { computed, ref, watch } from 'vue';
import { apiModifyCarStatus, apiStopCar, apiCheckApproval, attendanceLongterm, attendanceTempterm } from '@travel/api';
import { useAccountStore } from '@/store';
import PageNavbar from '@/components/PageNavbar/index.vue';
import AttendanceLocationSelector from './components/AttendanceLocationSelector.vue';
import PermissionView from '@/components/PermissionView/index.vue';
import { canShowByPermission } from '@/components/PermissionView/index.vue';
import {
  setLocationReporterEntityId,
  startLocationReporter,
  stopLocationReporter,
} from '@/services/locationReporterRuntime.js';
import { ensureUserLocationPermission, getCurrentLocationWithPermission } from './locationPermission.js';
import { getImageUrl, ImageCategory } from '@/utils/image';
// 坐标转化：扫码打卡时把小程序定位坐标转给后端需要的格式
import { convertGcj02ToWgs84 } from '@/utils/coordinate.js';
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { usePermissionStore } from '@/store/modules/permission.js';

// 车辆定位上报的业务类型，当前页面车辆定位统一使用 1
const VEHICLE_LOCATION_TYPE = 1;
// 保存车辆状态到本地，用于离开页面或重新登录后回显车辆表单。
const VEHICLE_STATE_KEY = 'attendanceVehicleState';
const VEHICLE_APPROVING_STATUS = '审批中';
const VEHICLE_APPROVED_STATUS = '已执行';
const VEHICLE_APPROVAL_CHECK_INTERVAL = 10000;
const VEHICLE_APPROVAL_MAX_CHECK_COUNT = 180;



// 页面静态资源
const attendanceCalendar = getImageUrl(ImageCategory.ATTENDANCE, 'attendance_01.png');
const attendanceScan = getImageUrl(ImageCategory.ATTENDANCE, 'attendance_04.png');
const attendanceRecord = getImageUrl(ImageCategory.ATTENDANCE, 'attendance_02.png');
const attendanceLeave = getImageUrl(ImageCategory.ATTENDANCE, 'attendance_03.png');

// 全局 store
const accountStore = useAccountStore();
const permissionStore = usePermissionStore();
// 当前用车状态对象：这里存的是当前页面用于恢复 / 关闭状态的车辆 payload
const selectedVehicle = ref(null);
// 当前是否处于“已开始使用车辆”的状态
const vehicleActive = ref(false);
// 当前车辆审批状态：审批中时页面回来要继续显示和轮询。
const vehicleApprovalStatus = ref('');
// 用车开始 / 结束按钮的提交锁，防止重复提交
const vehicleSubmitting = ref(false);
// 扫码打卡中的 loading 状态
const scanLoading = ref(false);
let vehicleApprovalRunId = 0;

// 当前页顶部欢迎文案显示名：按多个字段兜底
const displayUserName = computed(() => (
  accountStore.accountRealName
  || accountStore.accountInfo?.realName
  || accountStore.accountInfo?.accountName
  || accountStore.accountInfo?.name
  || '用户'
));

// 页面功能入口配置
const actionItems = [
  {
    title: '考勤记录/补卡',
    icon: attendanceRecord,
    type: 'record',
    permissionValue: 'member_attendance_count:list:card_apply',
  },
  {
    title: '请假申请',
    icon: attendanceLeave,
    type: 'leave',
    permissionValue: 'member_attendance_count:list:leave_apply',
  },
];

// 根据当前账号类型和权限，决定首页显示哪些操作入口
const filteredActionItems = computed(() => {
  return actionItems.filter((item = {}) => {
    // 临时工不显示请假
    if (accountStore.isTempWorker && item.type === 'leave') {
      return false;
    }

    // 临时工默认放行业务入口，不再走正式员工权限树
    if (accountStore.isTempWorker) {
      return true;
    }

    // 没有权限编码的入口默认显示
    if (!item.permissionValue) {
      return true;
    }

    // 正式员工按权限码过滤
    return canShowByPermission({
      code: item.permissionValue,
      ruleNames: permissionStore.ruleNames,
    });
  });
});

// 页面进入时恢复上次的用车状态缓存
onLoad(() => {
  restoreAndResumeVehicleState();
});

onShow(() => {
  restoreAndResumeVehicleState();
});

// 页面离开时保存当前用车状态
onUnload(() => {
  vehicleApprovalRunId += 1;
  saveVehicleState();
});

watch(
  () => accountStore.isTempWorker,
  (isTempWorker) => {
    // 切到临时工时清掉车辆状态，车辆定位只服务长期工用车。
    if (!isTempWorker) {
      return;
    }

    selectedVehicle.value = null;
    vehicleActive.value = false;
    vehicleApprovalStatus.value = '';
    stopAttendanceLocation();
    saveVehicleState();
  }
);

// 把当前页面的用车状态写入本地缓存
function saveVehicleState() {
  const currentVehicle = selectedVehicle.value;

  if (!currentVehicle && !vehicleActive.value && !vehicleApprovalStatus.value) {
    uni.removeStorageSync(VEHICLE_STATE_KEY);
    return;
  }

  uni.setStorageSync(VEHICLE_STATE_KEY, {
    selectedVehicle: currentVehicle,
    vehicleActive: vehicleActive.value,
    vehicleApprovalStatus: vehicleApprovalStatus.value,
  });
}

function clearVehiclePageState() {
  selectedVehicle.value = null;
  vehicleActive.value = false;
  vehicleApprovalStatus.value = '';
}

function normalizeStoredVehicleType(value) {
  const text = String(value ?? '').trim();

  if (text === '0' || text === '1') return text;
  if (text.includes('物资')) return '1';
  if (text.includes('营运') || text.includes('运营')) return '0';
  return text;
}

function normalizeStoredVehicleCategory(value) {
  const text = String(value ?? '').trim();

  if (text === '2' || text === '3') return text;
  if (text.includes('大车')) return '2';
  if (text.includes('小车')) return '3';
  return text;
}

function normalizeStoredVehicle(vehicle) {
  if (!vehicle) {
    return null;
  }

  return {
    ...vehicle,
    vehicleType: normalizeStoredVehicleType(vehicle.vehicleType),
    vehicleCategory: normalizeStoredVehicleCategory(vehicle.vehicleCategory),
  };
}

// 页面重新进入时恢复本地缓存中的用车状态
function restoreVehicleState() {
  if (accountStore.isTempWorker) {
    clearVehiclePageState();
    return;
  }

  const cache = uni.getStorageSync(VEHICLE_STATE_KEY);

  if (!cache) {
    clearVehiclePageState();
    return;
  }

  selectedVehicle.value = normalizeStoredVehicle(cache.selectedVehicle);
  vehicleActive.value = Boolean(cache.vehicleActive);
  vehicleApprovalStatus.value = cache.vehicleApprovalStatus || selectedVehicle.value?.approvalStatus || '';
}

function restoreAndResumeVehicleState() {
  restoreVehicleState();

  if (
    selectedVehicle.value?.id &&
    (
      vehicleApprovalStatus.value === VEHICLE_APPROVING_STATUS ||
      vehicleApprovalStatus.value === VEHICLE_APPROVED_STATUS
    ) &&
    !vehicleActive.value
  ) {
    resumeVehicleApproval();
  }
}

// 点击扫码入口：先做重复点击拦截，再调起设备扫码
function handleScanCodeTap() {
  if (scanLoading.value) {
    return;
  }

  uni.scanCode({
    onlyFromCamera: true,
    success: (res) => {
      // 获取扫码结果中的字符串内容
      const codeUrl = res.result;
      if (codeUrl) {
        handleScanTap(codeUrl);
      } else {
        showToast('扫码内容为空');
      }
    },
    fail: (err) => {
      // 用户主动取消扫码时不提示失败
      if (err && err.errMsg && err.errMsg.includes('cancel')) {
        return;
      }

      showToast('打卡失败');
    },
  });
}

// 页面统一 toast 出口：先隐藏 loading，再弹轻提示
function showToast(title) {
  uni.hideLoading();
  uni.showToast({
    title,
    icon: 'none',
    duration: 2000,
  });
}

// 生成当前打卡时间字符串
function formatClockTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// 扫码打卡前获取一次定位，并把 gcj02 坐标转成后端需要的 wgs84
async function getClockCoordinates() {
  let location;

  try {
    location = await getCurrentLocationWithPermission();
  } catch {
    throw new Error('定位失败，请开启定位权限');
  }

  const { longitude: lng, latitude: lat } = convertGcj02ToWgs84(
    location?.longitude,
    location?.latitude,
  );

  if (lng === null || lat === null) {
    throw new Error('定位失败，请开启定位权限');
  }

  return { lng, lat };
}

// 停止当前考勤定位：结束用车或启动失败时都走这里统一清理
function stopAttendanceLocation() {
  // 结束用车或开始失败时，统一关闭上报器并清空当前定位对象。
  stopLocationReporter({ silent: true });
  setLocationReporterEntityId('');
  return true;
}

// 扫码打卡主流程：取时间、取定位、按账号类型调对应打卡接口
async function handleScanTap(codeUrl) {
  //扫码打卡全流程
  scanLoading.value = true;

  try {
    const clockTime = formatClockTime();
    const { lng, lat } = await getClockCoordinates();

    await (accountStore.isTempWorker ? attendanceTempterm : attendanceLongterm)(
      {
        clockTime,
        codeUrl,
        lng,
        lat,
      },
      true
    );

    await delay(300);
    showToast('打卡成功');
  } catch (error) {
    await delay(300);
    showToast(error?.msg || error?.message || '打卡失败');
  } finally {
    scanLoading.value = false;
  }
}

// 小延迟工具：主要用于接口完成后稍微延后弹 toast，避免提示太生硬
function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 统一把值转成去空格字符串，避免 null / undefined 直接参与接口拼装
function normalizeValue(value) {
  if (value === null) {
    return null;
  }
  // 其他值转字符串并去掉首尾空格
  const str = String(value).trim();

  // 空字符串统一返回 null
  return str === '' ? null : str;
}

// 通用定位目标启动器：先设置当前定位对象，再真正启动上报器
async function applyLocationTarget(target, failureText = '定位启动失败') {
  const entityId = String(target?.entityId || '').trim();

  if (!entityId) {
    showToast('未获取到定位对象');
    return false;
  }

  setLocationReporterEntityId(entityId, target.type);
  try {
    await ensureUserLocationPermission();
  } catch {
    return false;
  }

  const started = await startLocationReporter();

  if (!started) {
    showToast(failureText);
  }

  return started;
}

// 审批通过后才真正启动车辆定位；页面回来继续查审批时也走这一段。
async function waitVehicleApproved(vehicle, shouldWaitFirst = true) {
  const approvalId = vehicle?.id;
  const runId = vehicleApprovalRunId + 1;
  let resStatus = vehicle?.approvalStatus || '';

  vehicleApprovalRunId = runId;

  if (!approvalId) {
    throw new Error('未获取到车辆审批单');
  }

  if (shouldWaitFirst) {
    await delay(VEHICLE_APPROVAL_CHECK_INTERVAL);
  }

  for (let checkCount = 0; checkCount < VEHICLE_APPROVAL_MAX_CHECK_COUNT; checkCount += 1) {
    if (runId !== vehicleApprovalRunId) {
      return false;
    }

    const { status } = await apiCheckApproval({ id: approvalId });
    resStatus = status;
    vehicleApprovalStatus.value = resStatus;
    selectedVehicle.value = {
      ...selectedVehicle.value,
      approvalStatus: resStatus,
    };
    saveVehicleState();

    if (resStatus === VEHICLE_APPROVED_STATUS) {
      break;
    }

    if (resStatus && resStatus !== VEHICLE_APPROVING_STATUS) {
      throw new Error(`车辆审批状态：${resStatus}`);
    }

    await delay(VEHICLE_APPROVAL_CHECK_INTERVAL);
  }

  if (runId !== vehicleApprovalRunId) {
    return false;
  }

  if (resStatus !== VEHICLE_APPROVED_STATUS) {
    throw new Error('车辆审批状态查询超时');
  }

  const locationStarted = await applyLocationTarget({
    entityId: vehicle.licensePlate,
    type: VEHICLE_LOCATION_TYPE,
  }, '车辆定位启动失败');

  if (!locationStarted) {
    vehicleActive.value = false;
    vehicleApprovalStatus.value = VEHICLE_APPROVED_STATUS;
    saveVehicleState();
    return false;
  }

  selectedVehicle.value = {
    ...vehicle,
    ...selectedVehicle.value,
    approvalStatus: VEHICLE_APPROVED_STATUS,
  };
  vehicleApprovalStatus.value = VEHICLE_APPROVED_STATUS;
  vehicleActive.value = true;
  saveVehicleState();
  return true;
}

async function resumeVehicleApproval() {
  // 页面重新进入时，如果上次停在审批中或已执行但定位没开，就接着把后半段补完。
  if (vehicleSubmitting.value) {
    return;
  }

  vehicleSubmitting.value = true;

  try {
    const started = await waitVehicleApproved(selectedVehicle.value, false);

    if (started) {
      await delay(800);
      showToast('已开始使用车辆');
    }
  } catch (error) {
    stopAttendanceLocation();
    vehicleActive.value = false;
    showToast(error?.msg || error?.message || '开始使用车辆失败');
  } finally {
    vehicleSubmitting.value = false;
  }
}

// 开始使用车辆：先提交审批单，审批通过后再启动车辆定位和缓存当前用车状态。
async function handleSubmitVehicle(vehicle) {
  // vehicle 是子组件 emit 过来的车辆表单对象
  if (
    selectedVehicle.value?.id &&
    vehicleApprovalStatus.value === VEHICLE_APPROVED_STATUS &&
    !vehicleActive.value
  ) {
    await resumeVehicleApproval();
    return;
  }

  const currentVehicle = vehicle || selectedVehicle.value || {};
  const licensePlate = normalizeValue(currentVehicle.licensePlate);
  const vehicleCategory = normalizeValue(currentVehicle.vehicleCategory);
  console.log('category',vehicleCategory)
  const vehiclePayload = {
    type: VEHICLE_LOCATION_TYPE,
    driverId: currentVehicle.driverId || accountStore.accountInfo?.id,
    licensePlate,
    vehicleType: currentVehicle.vehicleType,
    vehicleCategory,
    relatedCost: normalizeValue(currentVehicle.relatedCost ?? currentVehicle.amount),
    driverName: normalizeValue(currentVehicle.driverName),
    vehicleStatus: 1,
  };

  if (
    !licensePlate ||
    !vehiclePayload.vehicleType ||
    (vehiclePayload.vehicleType === '0' && !vehicleCategory) ||
    !vehiclePayload.relatedCost
  ) {
    showToast('请完善车辆使用信息');
    return;
  }

  if (vehicleSubmitting.value) {
    return;
  }

  let toastMessage = '';
  let shouldDelayToast = false;

  vehicleSubmitting.value = true;

  try {
    const { id: approvalId } = await apiModifyCarStatus(vehiclePayload, true);

    if (!approvalId) {
      throw new Error('未获取到车辆审批单');
    }

    // 审批单一创建就先落缓存，离开页面再回来还能看到“审批中”并继续查。
    selectedVehicle.value = {
      ...currentVehicle,
      ...vehiclePayload,
      id: approvalId,
      approvalStatus: VEHICLE_APPROVING_STATUS,
    };
    vehicleApprovalStatus.value = VEHICLE_APPROVING_STATUS;
    vehicleActive.value = false;
    saveVehicleState();

    const started = await waitVehicleApproved(selectedVehicle.value);

    if (started) {
      toastMessage = '已开始使用车辆';
      shouldDelayToast = true;
    }
  } catch (error) {
    stopAttendanceLocation();
    vehicleActive.value = false;
    toastMessage =
      error?.msg ||
      error?.message ||
      '开始使用车辆失败';
  } finally {
    vehicleSubmitting.value = false;
  }

  if (toastMessage && shouldDelayToast) {
    await delay(800);
    showToast(toastMessage);
    return;
  }

  if (toastMessage) {
    showToast(toastMessage);
  }
}

// 结束使用车辆：用创建审批单时返回的车辆 id 通知后端结束，再清掉本地定位和缓存。
async function handleCloseVehicle() {
  const vehicleId = selectedVehicle.value?.id;

  if (!vehicleId) {
    showToast('未获取到当前使用车辆');
    return;
  }

  if (vehicleSubmitting.value) {
    return;
  }

  vehicleSubmitting.value = true;

  let toastMessage = '';

  try {
    await apiStopCar({ id: vehicleId }, true);
    stopAttendanceLocation();
    vehicleActive.value = false;
    vehicleApprovalStatus.value = '';
    selectedVehicle.value = null;
    saveVehicleState();
    toastMessage = '已结束使用车辆';
  } catch (error) {
    toastMessage = error?.msg || error?.message || '结束使用车辆失败';
  } finally {
    vehicleSubmitting.value = false;
  }

  if (toastMessage) {
    await delay(800);
    showToast(toastMessage);
  }
}

// 首页功能入口跳转
function handleActionTap(title) {
  if (title === '考勤记录/补卡') {
    uni.navigateTo({
      url: '/packageAttendance/attendance-record/index',
    });
    return;
  }

  if (title === '请假申请') {
    uni.navigateTo({
      url: '/packageAttendance/attendance-leave/index',
    });
  }
}
</script >

<style scoped lang="less" >
.attendance-page {
  min-height: 100vh;
  background: #f4f7fb;
  box-sizing: border-box;
}

.hero-section {
  position: relative;
  overflow: visible;
  height: 312rpx;
  background: linear-gradient(180deg, #106AE8 0%, #106AE8 68.32%, #62ACF2 100%);
  box-sizing: border-box;
}

.content-bg {
  position: relative;
}

.hero-section::after {
  position: absolute;
  right: 0;
  bottom: -26rpx;
  left: 0;
  z-index: 0;
  width: 750rpx;
  height: 58rpx;
  background: linear-gradient(180deg, transparent 0%, transparent 50%, #62ACF2 50%, #62ACF2 100%);
  border-radius: 750rpx;
  content: '';
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 62rpx 40rpx 0;
}

.welcome-info {
  display: flex;
  flex-direction: column;
  padding-top: 2rpx;
}

.welcome-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 400;
  line-height: 44rpx;
}

.welcome-subtitle {
  margin-top: 10rpx;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 44rpx;
}

.calendar-image {
  width: 214rpx;
  height: 198rpx;
  margin-top: -34rpx;
  margin-right: 8rpx;
}

.content-area {
  position: relative;
  z-index: 2;
  margin-top: -82rpx;
  padding: 0 40rpx calc(32rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 10rpx 30rpx rgba(22, 59, 110, 0.04);
  box-sizing: border-box;
}

.scan-card {
  padding: 38rpx 24rpx 40rpx;
}

.action-card {
  margin-top: 40rpx;
  padding: 38rpx 24rpx 52rpx;
}

.section-title-wrap {
  display: flex;
  align-items: center;
}

.section-mark {
  width: 6rpx;
  height: 34rpx;
  margin-right: 14rpx;
  background: #1676f2;
  border-radius: 4rpx;
}

.section-title {
  color: #151515;
  font-size: 16px;
  font-weight: 700;
  line-height: 36rpx;
}

.section-desc {
  display: block;
  margin-top: 12rpx;
  padding-left: 20rpx;
  color: #9aa0a8;
  font-size: 21rpx;
  line-height: 30rpx;
}

.attendance-picker {
  display: block;
  margin-top: 26rpx;
}

.picker-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70rpx;
  padding: 0 22rpx;
  background: #ffffff;
  border: 2rpx solid #e8ebf0;
  border-radius: 6rpx;
  box-sizing: border-box;
}

.picker-text {
  color: #6f7782;
  font-size: 14px;
  line-height: 36rpx;
}

.picker-arrow {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}

.scan-box {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 358rpx;
  margin-top: 24rpx;
  background: #f2f5fb;
  border-radius: 16rpx;
}

.scan-image {
  width: 86rpx;
  height: 86rpx;
  margin-bottom: 28rpx;
}

.scan-text {
  color: #0068ff;
  font-size: 16px;
  font-weight: 700;
  line-height: 36rpx;
}

.scan-box--loading {
  pointer-events: none;
}

.scan-loading-mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(242, 245, 251, 0.92);
  border-radius: 16rpx;
}

.scan-loading-spinner {
  width: 56rpx;
  height: 56rpx;
  border: 6rpx solid rgba(0, 104, 255, 0.18);
  border-top-color: #0068ff;
  border-radius: 50%;
  animation: scan-loading-rotate 0.8s linear infinite;
  box-sizing: border-box;
}

.scan-loading-text {
  margin-top: 24rpx;
  color: #0068ff;
  font-size: 14px;
  font-weight: 700;
  line-height: 34rpx;
}

@keyframes scan-loading-rotate {
  100% {
    transform: rotate(360deg);
  }
}

.action-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  margin-top: 34rpx;
}

.action-grid :deep(> view) {
  width: calc((100% - 24rpx) / 2);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 300rpx;
  height: 218rpx;
  border-radius: 16rpx;
  text-align: center;
}

.action-item.record {
  background: #f3f7ff;
}

.action-item.leave {
  background: #fff0f2;
}

.action-icon {
  width: 74rpx;
  height: 74rpx;
  margin-bottom: 20rpx;
}

.action-title {
  display: block;
  width: 100%;
  font-size: 14px;
  font-weight: 700;
  line-height: 36rpx;
  text-align: center;
}

.record .action-title {
  color: #0068ff;
}

.leave .action-title {
  color: #ff3b30;
}
</style >
