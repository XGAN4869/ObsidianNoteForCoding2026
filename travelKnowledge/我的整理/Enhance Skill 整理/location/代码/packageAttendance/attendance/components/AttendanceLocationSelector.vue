<template >
  <view class="location-selector" >
    <view v-if="!isTempWorker" >
      <text class="mode-title" >运营车辆</text >
      <text class="mode-desc" >开始使用车辆后记录当前车辆定位</text >
    </view >


    <view class="field-block" >
      <text class="field-label" >驾驶员</text >
      <view class="readonly-input" >
        <text class="readonly-text" >{{ driverDisplayText }}</text >
      </view >
    </view >

    <view v-if="!isTempWorker" class="field-block" >
      <text class="field-label" >车牌号</text >
      <input v-model="formData.licensePlate"
             class="form-input"
             :disabled="formDisabled"
             placeholder="请输入车牌号"
             placeholder-class="field-placeholder" >
    </view >

    <view v-if="!isTempWorker" class="field-block" >
      <text class="field-label" >车辆类型</text >
      <picker :range="VEHICLE_TYPE_OPTIONS"
              rangeKey="label"
              :value="vehicleTypeIndex"
              :disabled="formDisabled"
              @change="handleVehicleTypeChange" >
        <view :class="['select-input', { 'select-input--disabled': formDisabled }]" >
          <text :class="formData.vehicleType ? 'select-text' : 'field-placeholder-text'" >
            {{ selectedVehicleTypeLabel || '请选择车辆类型' }}
          </text >
          <t-icon name="chevron-down"
                  size="36rpx"
                  :color="formDisabled ? 'var(--app-text-muted)' : 'var(--app-text-secondary)'" />
        </view >
      </picker >
    </view >

    <view v-if="showVehicleCategory" class="field-block" >
      <text class="field-label" >营运车辆</text >
      <picker :range="VEHICLE_CATEGORY_OPTIONS"
              rangeKey="label"
              :value="vehicleCategoryIndex"
              :disabled="formDisabled"
              @change="handleVehicleCategoryChange" >
        <view :class="['select-input', { 'select-input--disabled': formDisabled }]" >
          <text :class="formData.vehicleCategory ? 'select-text' : 'field-placeholder-text'" >
            {{ selectedVehicleCategoryLabel || '请选择大车/小车' }}
          </text >
          <t-icon name="chevron-down"
                  size="36rpx"
                  :color="formDisabled ? 'var(--app-text-muted)' : 'var(--app-text-secondary)'" />
        </view >
      </picker >
    </view >

    <view v-if="!isTempWorker" class="field-block" >
      <text class="field-label" >用车金额</text >
      <input v-model="formData.amount"
             class="form-input"
             :disabled="formDisabled"
             type="digit"
             placeholder="请输入用车金额"
             placeholder-class="field-placeholder"
             @blur="formData.amount = Number(formData.amount).toFixed(2)" >
    </view >

    <view class="status-row mt-20 mb-20" >
      <text :class="['status-pill', 'status-pill--vehicle' ]" >
        {{ statusText }}
      </text >
    </view >

    <t-button v-if="!isTempWorker && vehicleActive"
              block
              theme="primary"
              variant="outline"
              :loading="submitting"
              :disabled="submitting"
              tClass="selector-button selector-button--outline"
              @click="handleCloseVehicle" >
      {{ submitting ? '处理中...' : '结束使用车辆' }}
    </t-button >
    <t-button v-else-if="!isTempWorker"
              block
              theme="primary"
              :loading="submitting"
              :disabled="submitDisabled"
              tClass="selector-button"
              @click="handleSubmitVehicle" >
      {{ submitButtonText }}
    </t-button >
  </view >
</template >

<script setup >
import { computed, reactive, watch } from 'vue';

const props = defineProps({
  personalName: {
    type: String,
    default: '',
  },
  isTempWorker: {
    type: Boolean,
    default: false,
  },
  //被选车辆
  selectedVehicle: {
    type: Object,
    default: null,
  },
  //true/false，提交/关闭
  vehicleActive: {
    type: Boolean,
    default: false,
  },
  approvalStatus: {
    type: String,
    default: '',
  },
  submitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'closeVehicle',
  'submitVehicle',
]);

const OPERATING_VEHICLE_TYPE = '0';
const VEHICLE_TYPE_OPTIONS = [
  { label: '营运车辆', value: '0' },
  { label: '物资运输车辆', value: '1' },
];
const VEHICLE_CATEGORY_OPTIONS = [
  { label: '大车', value: '2' },
  { label: '小车', value: '3' },
];
const EMPTY_FORM = {
  licensePlate: '',
  vehicleType: '',
  vehicleCategory: '',
  amount: '',
};
const FORM_RULES = {
  licensePlate: '请输入车牌号',
  vehicleType: '请选择车辆类型',
  vehicleCategory: '请选择大车/小车',
  amount: '请输入用车金额',
};

// 表单只保存用户真实输入，显示文案和校验状态全部从这里派生。
const formData = reactive({
  ...EMPTY_FORM,
});

const approvalPending = computed(() => props.submitting || props.approvalStatus === '审批中');
const locationPending = computed(() => props.approvalStatus === '已执行' && !props.vehicleActive);
const formDisabled = computed(() => approvalPending.value || locationPending.value || props.vehicleActive);
const driverDisplayText = computed(() => props.personalName || '未获取到驾驶员');
const showVehicleCategory = computed(() => formData.vehicleType === OPERATING_VEHICLE_TYPE);
const vehicleTypeIndex = computed(() => (
  VEHICLE_TYPE_OPTIONS.findIndex((item) => item.value === formData.vehicleType)
));
const vehicleCategoryIndex = computed(() => (
  VEHICLE_CATEGORY_OPTIONS.findIndex((item) => item.value === formData.vehicleCategory)
));
const selectedVehicleTypeLabel = computed(() => (
  VEHICLE_TYPE_OPTIONS[vehicleTypeIndex.value]?.label || ''
));
const selectedVehicleCategoryLabel = computed(() => (
  VEHICLE_CATEGORY_OPTIONS[vehicleCategoryIndex.value]?.label || ''
));
const submitErrorText = computed(() => {
  if (!String(formData.licensePlate).trim()) return FORM_RULES.licensePlate;
  if (!formData.vehicleType) return FORM_RULES.vehicleType;
  if (showVehicleCategory.value && !formData.vehicleCategory) return FORM_RULES.vehicleCategory;
  if (!String(formData.amount).trim()) return FORM_RULES.amount;
  return '';
});
const submitDisabled = computed(() => (
  approvalPending.value ||
  props.vehicleActive ||
  (Boolean(submitErrorText.value) && !locationPending.value)
));
const submitButtonText = computed(() => {
  if (approvalPending.value) return '审批中...';
  if (locationPending.value) return '开启车辆定位';
  return '提交使用车辆审批';
});

const statusText = computed(() => {
  // 当前组件只负责车辆使用场景，所以状态文案只围绕“审批、定位、用车”变化。
  if (!props.isTempWorker) {
    if (approvalPending.value) {
      return '车辆审批中';
    }

    if (locationPending.value) {
      return '车辆已执行，请开启定位';
    }

    return props.vehicleActive ? '车辆使用中' : '待开始使用车辆';
  }

  return '';
});

//金额

function showToast(title) {
  // 统一走轻提示，避免每个按钮分支各自写一套提示逻辑。
  uni.showToast({
    title,
    icon: 'none',
    duration: 2000,
  });
}

function resetForm() {
  // 初始化或关闭车辆后，只恢复本地表单输入；父组件的车辆状态由父组件自己维护。
  Object.assign(formData, EMPTY_FORM);
}

function fillForm(vehicle = {}) {
  // 回显只接收父页面缓存或接口字段，避免和初始化逻辑混在一起。
  formData.licensePlate = String(vehicle.licensePlate || '').trim();
  formData.vehicleType = String(vehicle.vehicleType ?? '');
  formData.vehicleCategory = String(vehicle.vehicleCategory || '');
  formData.amount = String(vehicle.relatedCost ?? vehicle.amount ?? '');
}

function handleVehicleTypeChange(event) {
  // picker 返回的是下标，这里统一转成业务真正提交给后端的 value。
  // 车型变化后不直接处理 vehicleCategory，交给下面的 watch 做联动清理。
  const index = Number(event.detail.value);
  const option = VEHICLE_TYPE_OPTIONS[index];
  formData.vehicleType = option?.value || '';
}

function handleVehicleCategoryChange(event) {
  // “大车/小车”同样只保存真实 value，显示文案交给 computed 负责。
  const index = Number(event.detail.value);
  const option = VEHICLE_CATEGORY_OPTIONS[index];
  formData.vehicleCategory = option?.value || '';
}

function handleSubmitVehicle() {
  // 提交流程固定：
  // 1. 先用集中校验结果拦截空字段；
  // 2. 再把表单值和展示文案一次性组装给父组件；
  // 3. 真正的接口请求、定位开启都由父组件处理。
  if (submitErrorText.value) {
    showToast(submitErrorText.value);
    return;
  }

  emit('submitVehicle', {
    licensePlate: String(formData.licensePlate).trim(),
    vehicleType: formData.vehicleType,
    vehicleTypeName: selectedVehicleTypeLabel.value,
    vehicleCategory: showVehicleCategory.value ? formData.vehicleCategory : null,
    amount: String(formData.amount).trim(),
    driverName: driverDisplayText.value,
  });
}

function handleCloseVehicle() {
  // 关闭动作只负责向父组件发信号；
  // 是否真的结束用车、是否恢复人员定位，都由父组件串业务流程。
  if (props.submitting) {
    return;
  }
  emit('closeVehicle', true);
}

watch(
  () => formData.vehicleType,
  (vehicleType) => {
    // 非营运车辆不需要“大车/小车”维度，
    // 所以类型一旦切走，就把旧的 vehicleCategory 清掉，避免提交脏数据。
    if (vehicleType !== OPERATING_VEHICLE_TYPE) {
      formData.vehicleCategory = null;
    }
  }
);

watch(
  () => props.selectedVehicle,
  (vehicle) => {
    // 父组件传入已选车辆时，子组件负责把缓存/接口数据回填到表单；
    // 没有车辆且当前也没激活车辆使用时，再把表单清空，避免误清正在使用中的展示数据。
    if (props.isTempWorker || !vehicle) {
      if (!props.vehicleActive) {
        resetForm();
      }
      return;
    }

    fillForm(vehicle);
  },
  { immediate: true }
);

watch(
  () => props.isTempWorker,
  (isTempWorker) => {
    // 临时工没有车辆使用场景，身份切换后直接清空整份车辆表单。
    if (isTempWorker) {
      resetForm();
    }
  },
  { immediate: true }
);

watch(
  () => props.vehicleActive,
  (isActive, wasActive) => {
    if (props.isTempWorker) {
      return;
    }
    // 父组件通知“车辆已结束使用”后，这里只做表单收尾清理。
    // 这样页面刷新恢复、关闭车辆后的表单状态都能保持一致。
    if (!isActive && wasActive) {
      resetForm();
    }
  }
);
</script >

<style scoped lang="less" >
.location-selector {
  margin-top: 30rpx;
}

.mode-title,
.mode-desc {
  display: block;
}

.mode-title {
  color: var(--app-text-title);
  font: var(--app-font-section-title);
}

.mode-desc {
  margin-top: 8rpx;
  color: var(--app-text-muted);
  font: var(--app-font-section-small);
}

.field-block {
  margin-top: 26rpx;
}

.field-label {
  display: block;
  margin-bottom: 12rpx;
  color: var(--app-text-secondary);
  font: var(--app-font-page-label);
}

.readonly-input,
.form-input,
.select-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 78rpx;
  padding: 0 22rpx;
  background: var(--app-color-white);
  border: 2rpx solid var(--app-button-neutral-bg);
  border-radius: 10rpx;
  box-sizing: border-box;
}

.readonly-input {
  background: var(--app-content-bg);
}

.readonly-text,
.select-text {
  overflow: hidden;
  color: var(--app-text-primary);
  font: var(--app-font-control);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-input {
  width: 100%;
  color: var(--app-text-primary);
  font: var(--app-font-control);
}

.select-input {
  padding: 0 18rpx 0 22rpx;
}

.select-input--disabled,
.form-input[disabled] {
  background: var(--app-content-bg);
}

.field-placeholder,
.field-placeholder-text {
  color: var(--app-text-muted);
  font: var(--app-font-control);
}

.status-row {
  display: flex;
  margin-top: 24rpx;
}

.status-pill {
  height: 44rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  font: var(--app-font-section-small);
  line-height: 44rpx;
}

.status-pill--vehicle {
  color: var(--app-tag-gray-text);
  background: var(--app-tag-gray-bg);
}

.selector-button {
  height: 78rpx !important;
  margin-top: 28rpx;
  border-radius: 12rpx !important;
  font: var(--app-font-control) !important;
}

.selector-button--outline {
  background: var(--app-color-white) !important;
}

</style >
