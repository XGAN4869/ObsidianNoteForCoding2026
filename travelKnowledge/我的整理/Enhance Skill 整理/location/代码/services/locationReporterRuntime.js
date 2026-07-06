/*
  运行时桥接层
- 页面只关心：我要跟踪谁（人 / 车）
- runtime 帮你转成：entityId + type
- 再去调用底层 locationReporter
*/

import { reportTrack } from '@travel/api';

// 通用定位上报器工厂，里面封装了权限、定位、节流、失败重试等逻辑。
import { createLocationReporter } from './locationReporter.js';

// 定位上报运行时状态只给当前 runtime 用，直接放回同文件，少一个中转文件。
const LOCATION_REPORTER_RUNTIME_STORAGE_KEY = 'LOCATION_REPORTER_RUNTIME_STATE';
const VEHICLE_LOCATION_TYPE = 1;

function normalizeLocationReporterEntityId(entityId) {
  return String(entityId || '').trim();
}

function normalizeLocationReporterType(type) {
  return type ?? 2;
}

function normalizeLocationReporterRuntimeState(rawState = {}) {
  const entityId = normalizeLocationReporterEntityId(rawState.entityId);

  return {
    entityId,
    type: normalizeLocationReporterType(rawState.type),
    active: Boolean(rawState.active && entityId),
  };
}


function writeLocationReporterRuntimeState(storageApi = uni, partialState = {}) {
  const previousState = readLocationReporterRuntimeState(storageApi);
  const nextState = normalizeLocationReporterRuntimeState({
    ...previousState,
    ...partialState,
  });

  storageApi?.setStorageSync?.(
    LOCATION_REPORTER_RUNTIME_STORAGE_KEY,
    JSON.stringify(nextState),
  );

  return nextState;
}

function shouldResumeLocationReporterRuntime(state = {}) {
  const normalizedState = normalizeLocationReporterRuntimeState(state);
  return Boolean(
    normalizedState.active
    && normalizedState.entityId
    && Number(normalizedState.type) === VEHICLE_LOCATION_TYPE
  );
}

function readLocationReporterRuntimeState(storageApi = uni) {
  //将状态存在本地
  const rawValue = storageApi?.getStorageSync?.(LOCATION_REPORTER_RUNTIME_STORAGE_KEY);
  
  if (!rawValue) {
    return normalizeLocationReporterRuntimeState();
  }
  
  if (typeof rawValue === 'object') {
    return normalizeLocationReporterRuntimeState(rawValue);
  }
  
  try {
    return normalizeLocationReporterRuntimeState(JSON.parse(rawValue));
  } catch (_error) {
    return normalizeLocationReporterRuntimeState();
  }
}

//TODO:1启动时读取本地缓存
const persistedRuntimeState = readLocationReporterRuntimeState(uni);

// 当前要上报给后端的对象 ID。
// 例如登录后可以设置成员工账号、账号名或后端要求的实体 ID。
let locationReporterEntityId = persistedRuntimeState.entityId;

// 当前上报类型，默认 2。
// type 的业务含义由后端约定，这里只是透传。
let locationReporterType = persistedRuntimeState.type;

// 创建整个应用唯一的定位上报器实例。
const locationReporter = createLocationReporter({
  // reporter 每次准备上报时，都会调用这个函数拿最新 entityId。
  getEntityId() {
    return locationReporterEntityId;
  },
  
  // reporter 每次准备上报时，都会调用这个函数拿最新 type。
  getType() {
    return locationReporterType;
  },
  
  // reporter 生成单个定位点 point 后，会调用这个函数真正发请求。
  submitLocationReport(point) {
    // reportTrack 接口需要数组，所以这里把单个 point 包成 [point]。
    // 第二个参数 false 保持原有接口调用约定，不在这里改变业务行为。
    return reportTrack([point], false);
  },
});

// 设置定位上报对象。
// 登录成功后通常会调用它，把当前账号信息交给定位上报器。
export function setLocationReporterEntityId(entityId, type = 2) {
  // entityId 统一转成字符串并去掉首尾空格，避免传 null/undefined 给后端。
  locationReporterEntityId = String(entityId || '').trim();
  
  // type 如果没传，就继续使用默认值 2。
  locationReporterType = type ?? 2;

  writeLocationReporterRuntimeState(uni, {
    entityId: locationReporterEntityId,
    type: locationReporterType,
    active: locationReporterEntityId
      ? readLocationReporterRuntimeState(uni).active
      : false,
  });
}

// 开启定位上报。
// App onShow 或登录成功后会调用它。
export function startLocationReporter() {
  // 具体启动流程交给 locationReporter.js 里的 start。
  const runtimeState = readLocationReporterRuntimeState(uni);

  if (!locationReporterEntityId && runtimeState.entityId) {
    locationReporterEntityId = runtimeState.entityId;
    locationReporterType = runtimeState.type;
  }

  return locationReporter.start().then((started) => {
    if (started) {
      writeLocationReporterRuntimeState(uni, {
        entityId: locationReporterEntityId,
        type: locationReporterType,
        active: true,
      });
    }

    return started;
  });
}

// 停止定位上报。
// 退出登录时会调用它，避免用户退出后还继续上报定位。
export function stopLocationReporter(options) {
  // options 可以传 { silent: true }，表示停止时少打一点日志。
  const result = locationReporter.stop(options);

  writeLocationReporterRuntimeState(uni, {
    entityId: locationReporterEntityId,
    type: locationReporterType,
    active: false,
  });

  return result;
}

export function shouldResumeLocationReporter() {
  const runtimeState = readLocationReporterRuntimeState(uni);

  if (runtimeState.entityId) {
    locationReporterEntityId = runtimeState.entityId;
    locationReporterType = runtimeState.type;
  }

  return shouldResumeLocationReporterRuntime(runtimeState);
}
