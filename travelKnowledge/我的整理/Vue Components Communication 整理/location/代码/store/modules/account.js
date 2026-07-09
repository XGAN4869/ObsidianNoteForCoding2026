import { apiCheckApproval, getLoginInfoUniapp, loginTemp, loginTempInfo, loginUniapp } from '@travel/api';
import { defineStore } from 'pinia';

import {
  setLocationReporterEntityId,
  startLocationReporter,
  stopLocationReporter,
} from '@/services/locationReporterRuntime.js';

import {
  APP_ACCOUNT_SOURCE,
  TEMP_WORKER_ACCOUNT_SOURCE,
  buildStoredToken,
  isTempWorkerAuthToken,
} from './account-auth.js';
import { deriveAccountFields, normalizeAccountInfoResponse } from './account-normalize.js';
import { usePermissionStore } from './permission.js';

const VEHICLE_LOCATION_TYPE = 1;
const VEHICLE_STATE_KEY = 'attendanceVehicleState';
const VEHICLE_APPROVING_STATUS = '审批中';
const VEHICLE_APPROVED_STATUS = '已执行';
const VEHICLE_APPROVAL_CHECK_INTERVAL = 10000;
const VEHICLE_APPROVAL_MAX_CHECK_COUNT = 180;
let vehicleApprovalRunId = 0;

function applyToken(token, accountSource) {
  const storedToken = buildStoredToken(token, accountSource);

  uni.setStorageSync('AUTHORIZATIONID', storedToken.accountId);
  uni.setStorageSync('AUTHORIZATION', storedToken.authToken);
  uni.setStorageSync('ACCOUNT_SOURCE', 'app');
}

function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

function getVehicleUsageForm(loginInfo = {}) {
  return loginInfo?.vehicleUsageForm || loginInfo?.data?.vehicleUsageForm || null;
}

function normalizeVehicleType(value) {
  const text = normalizeText(value);

  if (text === '0' || text === '1') {
    return text;
  }

  if (text.includes('物资')) {
    return '1';
  }

  if (text.includes('营运') || text.includes('运营')) {
    return '0';
  }

  return text;
}

function normalizeVehicleCategory(value) {
  const text = normalizeText(value);

  if (text === '2' || text === '3') {
    return text;
  }

  if (text.includes('大车')) {
    return '2';
  }

  if (text.includes('小车')) {
    return '3';
  }

  return text;
}

function clearVehicleStateCache() {
  vehicleApprovalRunId += 1;
  stopLocationReporter({ silent: true });
  setLocationReporterEntityId('');
  uni.removeStorageSync(VEHICLE_STATE_KEY);
}

function buildVehicleState(vehicleUsageForm = {}) {
  const approvalStatus = normalizeText(vehicleUsageForm.status || vehicleUsageForm.statusInfo);
  const vehicleType = normalizeVehicleType(vehicleUsageForm.vehicleType);
  const relatedCost = vehicleUsageForm.relatedCost ?? vehicleUsageForm.amount ?? '';

  return {
    ...vehicleUsageForm,
    id: vehicleUsageForm.id,
    driverId: vehicleUsageForm.driverId,
    driverName: normalizeText(vehicleUsageForm.driverName),
    licensePlate: normalizeText(vehicleUsageForm.licensePlate),
    vehicleType,
    vehicleTypeName: normalizeText(vehicleUsageForm.vehicleTypeName || vehicleUsageForm.vehicleType),
    vehicleCategory: normalizeVehicleCategory(vehicleUsageForm.vehicleCategory),
    relatedCost,
    amount: relatedCost,
    approvalStatus,
    status: approvalStatus,
    statusInfo: normalizeText(vehicleUsageForm.statusInfo || approvalStatus),
  };
}

function syncVehicleUsageFormFromLoginInfo(loginInfo = {}, isTempWorker = false) {
  const vehicleUsageForm = getVehicleUsageForm(loginInfo);

  if (isTempWorker || !vehicleUsageForm) {
    return false;
  }

  // 后端返回 endTime 代表本次用车已结束，本地车辆表单和定位都要收掉。
  if (vehicleUsageForm.endTime) {
    clearVehicleStateCache();
    return true;
  }

  const vehicle = buildVehicleState(vehicleUsageForm);
  const approvalStatus = vehicle.approvalStatus;

  if (
    !vehicle.licensePlate ||
    (
      approvalStatus !== VEHICLE_APPROVING_STATUS &&
      approvalStatus !== VEHICLE_APPROVED_STATUS
    )
  ) {
    return false;
  }

  const cache = uni.getStorageSync(VEHICLE_STATE_KEY);
  const cachedVehicle = cache?.selectedVehicle;
  const isSameVehicle = Boolean(
    cachedVehicle &&
    (
      (vehicle.id && cachedVehicle.id === vehicle.id) ||
      cachedVehicle.licensePlate === vehicle.licensePlate
    )
  );

  uni.setStorageSync(VEHICLE_STATE_KEY, {
    selectedVehicle: vehicle,
    vehicleActive: approvalStatus === VEHICLE_APPROVED_STATUS && isSameVehicle
      ? Boolean(cache?.vehicleActive)
      : false,
    vehicleApprovalStatus: approvalStatus,
  });

  return true;
}

export const useAccountStore = defineStore('system', {
  state: () => ({
    loginInfo: {},
    accountInfo: {},
    accountList: [],
    roleList: [],
    isLogin: false,
    isTempWorker: false,
    cosRegion: '',
    bucketName: '',
    cosDir: '',
    accountRealName: '',
    accountRoleName: '',
    accountDepartmentId: '',
    accountDepartmentName: '',
    accountDepartmentBelongBlock: '',
    runKey: Date.now(),
    loading: false,
    lastPromise: null,
  }),
  actions: {
    resetAccountState() {
      this.loginInfo = {};
      this.accountInfo = {};
      this.accountList = [];
      this.roleList = [];
      this.isLogin = false;
      this.isTempWorker = false;
      this.cosRegion = '';
      this.bucketName = '';
      this.cosDir = '';
      this.accountRealName = '';
      this.accountRoleName = '';
      this.accountDepartmentId = '';
      this.accountDepartmentName = '';
      this.accountDepartmentBelongBlock = '';
      this.loading = false;
      this.lastPromise = null;
    },
    logout() {
      const permissionStore = usePermissionStore();

      vehicleApprovalRunId += 1;
      stopLocationReporter({ silent: true });
      setLocationReporterEntityId('');
      uni.removeStorageSync('AUTHORIZATION');
      uni.removeStorageSync('AUTHORIZATIONID');
      uni.removeStorageSync('ACCOUNT_SOURCE');
      uni.removeStorageSync('loginInfo');
      permissionStore.resetPermission();
      this.resetAccountState();
    },
    async login(form) {
      uni.showLoading();

      try {
        const token = await loginUniapp(form);

        applyToken(token, APP_ACCOUNT_SOURCE);
        this.isLogin = true;
        this.isTempWorker = false;

        await this.getSystemInfo(true);
        await this.resumeVehicleLocation();
      } finally {
        uni.hideLoading();
      }
    },
    //只调 loginTemp，拿到 token 后写入：
    // AUTHORIZATIONID
    // AUTHORIZATION
    // ACCOUNT_SOURCE = app
    async loginTempWorker(form) {
      uni.showLoading();

      try {
        const token = await loginTemp({
          phone: form.phone,
          password: form.password,
        });

        //存token
        applyToken(token, TEMP_WORKER_ACCOUNT_SOURCE);
        this.isLogin = true;
        this.isTempWorker = true;

        //getSystemInfo() 通过 token 里是否包含 TEMP- 判断是不是临时工：
        // 临时工调用 loginTempInfo
        // 正式员工调用 getLoginInfoUniapp
        await this.getSystemInfo(true);
      } finally {
        uni.hideLoading();
      }
    },
    getSystemInfo(reload = false) {
      if (this.loading) {
        return this.lastPromise;
      }

      if (this.accountInfo.id && !reload) {
        return Promise.resolve(this.accountInfo);
      }

      this.loading = true;
      const authToken = uni.getStorageSync('AUTHORIZATION');
      const isTemp = isTempWorkerAuthToken(authToken);
      //通过判断存取的token来调用 正式工接口/临时工接口
      const loadLoginInfo = isTempWorkerAuthToken(authToken)
        ? loginTempInfo
        : getLoginInfoUniapp;

      this.lastPromise = loadLoginInfo()
        .then(async(res) => {
          const permissionStore = usePermissionStore();
          const accountInfo = normalizeAccountInfoResponse(res);
          const derivedFields = deriveAccountFields(accountInfo);

          if(!isTemp) {
            // 只有正式员工才去拉取权限
            await permissionStore.fetchPermissionInfo(true);
          }else{
            // 临时工默认固定为考勤打卡菜单
            permissionStore.setTempWorkerPermission();
          }

          this.loginInfo = res;
          uni.setStorageSync('loginInfo', res);
          syncVehicleUsageFormFromLoginInfo(res, isTemp);
          this.accountInfo = accountInfo;
          this.isLogin = true;
          this.isTempWorker = isTemp;
          this.cosRegion = res?.cosRegion || res?.data?.cosRegion || '';
          this.bucketName = res?.bucketName || res?.data?.bucketName || '';
          this.cosDir = res?.cosDir || res?.data?.cosDir || '';
          this.accountRealName = derivedFields.realName;
          this.accountRoleName = derivedFields.roleName;
          this.accountDepartmentId = derivedFields.departmentId;
          this.accountDepartmentName = derivedFields.departmentName;
          this.accountDepartmentBelongBlock = derivedFields.departmentBelongBlock;
          return accountInfo;
        })
        .finally(() => {
          this.loading = false;
        });

      return this.lastPromise;
    },
    async resumeVehicleLocation() {
      // 退出登录会清空运行时定位对象，重新登录后用车辆状态缓存恢复车辆审批或车辆上报。
      if (this.isTempWorker) {
        return false;
      }

      const cache = uni.getStorageSync(VEHICLE_STATE_KEY);
      const vehicle = cache?.selectedVehicle;
      const approvalStatus = cache?.vehicleApprovalStatus || vehicle?.approvalStatus || '';

      if (!vehicle?.licensePlate) {
        return false;
      }

      if (cache?.vehicleActive) {
        setLocationReporterEntityId(vehicle.licensePlate, VEHICLE_LOCATION_TYPE);
        return startLocationReporter();
      }

      if (
        vehicle?.id &&
        (
          approvalStatus === VEHICLE_APPROVING_STATUS ||
          approvalStatus === VEHICLE_APPROVED_STATUS
        )
      ) {
        this.resumeVehicleApproval(vehicle)
          .catch((error) => {
            console.error('resume vehicle approval failed', error);
          });
        return true;
      }

      return false;
    },
    async resumeVehicleApproval(vehicle) {
      // 审批中退出登录后，重新登录要接着查；审批过了再启动车辆定位。
      const runId = vehicleApprovalRunId + 1;
      let resStatus = vehicle?.approvalStatus || VEHICLE_APPROVING_STATUS;
      vehicleApprovalRunId = runId;

      for (let checkCount = 0; checkCount < VEHICLE_APPROVAL_MAX_CHECK_COUNT; checkCount += 1) {
        if (runId !== vehicleApprovalRunId) {
          return false;
        }

        if (resStatus !== VEHICLE_APPROVED_STATUS) {
          const { status } = await apiCheckApproval({ id: vehicle.id });
          resStatus = status;
        }

        uni.setStorageSync(VEHICLE_STATE_KEY, {
          selectedVehicle: {
            ...vehicle,
            approvalStatus: resStatus,
          },
          vehicleActive: false,
          vehicleApprovalStatus: resStatus,
        });

        if (resStatus === VEHICLE_APPROVED_STATUS) {
          break;
        }

        if (resStatus && resStatus !== VEHICLE_APPROVING_STATUS) {
          return false;
        }

        await delay(VEHICLE_APPROVAL_CHECK_INTERVAL);
      }

      if (runId !== vehicleApprovalRunId || resStatus !== VEHICLE_APPROVED_STATUS) {
        return false;
      }

      setLocationReporterEntityId(vehicle.licensePlate, VEHICLE_LOCATION_TYPE);
      const started = await startLocationReporter();

      if (started) {
        uni.setStorageSync(VEHICLE_STATE_KEY, {
          selectedVehicle: {
            ...vehicle,
            approvalStatus: VEHICLE_APPROVED_STATUS,
          },
          vehicleActive: true,
          vehicleApprovalStatus: VEHICLE_APPROVED_STATUS,
        });
      }

      return started;
    },
  },
  persist: true,
});
