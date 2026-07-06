/**
底层持续定位上报层
 *前台/后台定位权限校验
 *startLocationUpdateBackground
 *监听 onLocationChange
 *静默时主动补采定位
 *上报失败重试
 *本地缓存待重试 payload
 *构造轨迹上报数据
 *真正调用后端 reportTrack
*/
import { convertGcj02ToWgs84 } from '../utils/coordinate.js';

/*
 * 定位上报服务
 *
 * 这个文件只负责“怎么拿定位、怎么节流、怎么失败重试、怎么调用上报接口”。
 * 它不直接关心当前登录的是谁，当前登录人是谁由外面的 runtime 文件传进来。
 *
 * 使用方式可以理解成：
 * 1. 业务代码不要到处直接调用 uni.startLocationUpdateBackground。
 * 2. 统一创建一个 reporter。
 * 3. reporter.start() 开启定位上报。
 * 4. reporter.stop() 停止定位上报。
 */

// 本地缓存 key：记录“上一次成功上报定位”的时间戳。
export const LAST_REPORT_STORAGE_KEY = 'LOCATION_REPORT_LAST_SUCCESS_AT';

// 本地缓存 key：记录“上次上报失败、等待下次重试”的定位数据。
export const PENDING_REPORT_STORAGE_KEY = 'LOCATION_REPORT_PENDING_PAYLOAD';

const LOCATION_SERVICE_DISABLED_MESSAGE = '检测到手机定位服务未开启或当前无法获取定位，请先在系统设置中打开定位服务，并确认微信已获得定位权限，然后返回页面重试。';
const LOCATION_ERROR_LOG_COOLDOWN_MS = 15 * 1000;
const REPORT_ERROR_LOG_COOLDOWN_MS = 15 * 1000;
const USER_FACING_ERROR_COOLDOWN_MS = 60 * 1000;
const PENDING_RETRY_COOLDOWN_MS = 60 * 1000;

const USER_LOCATION_SCOPE = 'scope.userLocation';
//后台定位授权key ||  https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/authorize.html?f_link_type=f_linkinlinenote&flow_extra=eyJpbmxpbmVfZGlzcGxheV9wb3NpdGlvbiI6MCwiZG9jX3Bvc2l0aW9uIjowLCJkb2NfaWQiOiI1ZGRkNmM2NDQ2Y2JlN2U4LTMwNzkwMmEwNzM4MzY1NTkifQ%3D%3D
const BACKGROUND_LOCATION_SCOPE = 'scope.userLocationBackground';
const FOREGROUND_LOCATION_PERMISSION_MESSAGE = '请开启使用时定位权限';
const BACKGROUND_LOCATION_PERMISSION_MESSAGE = '为了持续记录轨迹，请在设置中开启后台定位权限';
const BACKGROUND_LOCATION_REQUIRED_SCOPES = [USER_LOCATION_SCOPE, BACKGROUND_LOCATION_SCOPE];

// 这一段只做基础值转换，后面的上报和日志都复用这里的结果。
function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function toSevenDecimalNumberOrNull(value) {
  const normalized = toNumberOrNull(value);
  return normalized === null ? null : Number(normalized.toFixed(7));
}

function toIntegerOrNull(value) {
  const normalized = toNumberOrNull(value);
  return normalized === null ? null : Math.round(normalized);
}

function toIsoString(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function toKmhNumberOrNull(value) {
  const normalized = toNumberOrNull(value);
  return normalized === null ? null : Number((normalized * 3.6).toFixed(2));
}

// 这一段统一处理错误文案和错误分类，避免后面每个流程都自己拆 errMsg。
function getErrorMessage(error) {
  return error?.errMsg ||
    error?.errStr ||
    error?.message ||
    error?.msg ||
    error?.raw?.errMsg ||
    error?.raw?.errStr ||
    error?.raw?.message ||
    error?.raw?.msg ||
    'Unknown location error';
}

function classifyLocationError(error) {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes('auth deny')
    || message.includes('auth denied')
    || message.includes('permission denied')
    || message.includes('scope.userlocation')
  ) {
    return 'permission-denied';
  }

  if (message.includes('wifi_locationswitchoff') || message.includes('locationswitchoff')) {
    return 'location-service-disabled';
  }

  if (message.includes('nocell')) {
    return 'location-unavailable';
  }

  if (message.includes('timeout')) {
    return 'location-timeout';
  }

  return 'unknown-location';
}

function classifyReportError(error) {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes('err_address_unreachable')
    || message.includes('address unreachable')
    || message.includes('err_connection_refused')
    || message.includes('connection refused')
  ) {
    return 'server-unreachable';
  }

  if (
    message.includes('err_network_changed')
    || message.includes('network changed')
    || message.includes('request fail timeout')
    || message.includes('timeout')
  ) {
    return 'network-transient';
  }

  return 'unknown-report';
}

function shouldPromptLocationIssue(classification) {
  return classification === 'location-service-disabled' || classification === 'location-unavailable';
}

function hasUsableLocationCoordinates(location) {
  return toSevenDecimalNumberOrNull(location?.longitude) !== null
    && toSevenDecimalNumberOrNull(location?.latitude) !== null;
}

// 这一段把 uni callback API 收成 Promise，用于权限、定位和设置页调用。
function callUniApi(uniApi, methodName, options = {}) {
  return new Promise((resolve, reject) => {
    const method = uniApi?.[methodName];

    if (typeof method !== 'function') {
      reject(new Error(`Current environment does not support ${methodName}`));
      return;
    }

    method.call(uniApi, {
      ...options,
      success: resolve,
      fail: reject,
    });
  });
}

// 本地待重试数据允许是字符串缓存，也允许是已经解析过的对象。
function parsePendingPayload(rawValue) {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    return null;
  }
}

// 把 uni 返回的定位结果整理成后端轨迹接口需要的 point 对象。
export function buildLocationReportPayload(location, options = {}) {
  // reportedAt 表示“这次上报发生的时间”，默认用当前时间。
  const reportedAt = options.reportedAt ?? Date.now();
  
  // locationTime 表示“定位点产生的时间”，没有单独传就用上报时间。
  const locationTime = options.locationTime ?? reportedAt;
  const wgs84Coordinate = convertGcj02ToWgs84(location?.longitude, location?.latitude);
  
  // 返回后端需要的字段结构。
  return {
    // entityId 是被追踪对象的标识，比如账号、员工编号等。
    entityId: String(options.entityId ?? '').trim(),
    
    // type 是业务类型，默认 2；具体含义由后端约定。
    type: options.type ?? 2,
    
    // 经度，保留 7 位小数。
    lng: wgs84Coordinate.longitude,
    
    // 纬度，保留 7 位小数。
    lat: wgs84Coordinate.latitude,
    
    // 定位时间，转成 ISO 字符串。
    trackTime: toIsoString(locationTime),
    
    // 速度，可能为空。
    speed: toKmhNumberOrNull(location?.speed),
    
    // 方向角，取整，可能为空。
    direction: toIntegerOrNull(location?.direction),
    
    // 定位精度，可能为空。
    accuracy: toNumberOrNull(location?.accuracy),
    
    // 海拔，可能为空。
    altitude: toNumberOrNull(location?.altitude),
    
    // 客户端上报时间，转成 ISO 字符串。
    clientTime: toIsoString(reportedAt),
  };
}

// 创建一个定位上报器。外部拿到它以后，只需要调用 start/stop。
export function buildLocationCoordinateDebugInfo(location) {
  return {
    rawGcj02: {
      longitude: toSevenDecimalNumberOrNull(location?.longitude),
      latitude: toSevenDecimalNumberOrNull(location?.latitude),
    },
    wgs84: convertGcj02ToWgs84(location?.longitude, location?.latitude),
  };
}

export function createLocationReporter(options = {}) {
  // 默认使用全局 uni；测试时可以传假的 uniApi 进来。
  const uniApi = options.uniApi ?? uni;
  
  // 默认使用 console 打日志；测试时可以传假的 logger。
  const logger = options.logger ?? console;
  
  // 当前时间函数，默认 Date.now；测试时可以传固定时间。
  const now = options.now ?? (() => Date.now());
  
  // 真正调用后端接口的函数，由外部传入。
  const submitLocationReport = options.submitLocationReport;
  
  // 获取当前上报对象 ID 的函数，例如当前账号。
  const getEntityId = options.getEntityId ?? (() => options.entityId || '');
  
  // 获取当前上报类型的函数，默认 2。
  const getType = options.getType ?? (() => options.type ?? 2);
  
  // 没有后端提交函数时，这个服务无法工作，所以直接抛错。
  if (typeof submitLocationReport !== 'function') {
    throw new Error('submitLocationReport is required');
  }
  
  // 运行时状态都放在 state 里，避免散落成很多变量。
  const state = {
    
    //#region 1. 服务器启动状态
    // 标记定位上报服务是否已经启动。
    isStarted: false,
    
    // 保存正在启动中的 Promise，异步锁 / 防重复启动标记。, 当前有没有一个 start() 正在执行，防止短时间内多次调用 start() 导致重复启动。
    //启动完成后，通常会清掉：finally {  this.startPromise = null  }
    startPromise: null,
    //#endregion
    
    //#region 2. 上报状态
    // 从本地缓存恢复上次成功上报时间；没有缓存就用 0。
    lastReportedAt: Number(uniApi.getStorageSync(LAST_REPORT_STORAGE_KEY)) || 0,
    
    // 从本地缓存恢复上次失败的数据；没有就为 null。
    pendingPayload: parsePendingPayload(uniApi.getStorageSync(PENDING_REPORT_STORAGE_KEY)),
    //#endregion
    
    //#region 3. 监听器状态
    // 保存定位变化监听函数，stop 时要用它解绑。
    locationChangeHandler: null,
    
    // 保存定位错误监听函数，stop 时要用它解绑。
    locationErrorHandler: null,
    //#endregion
    
    //#region 4. 保活和补偿状态
    // 记录系统最后一次推送或主动采集定位的时间。
    lastSystemLocationTime: 0,
    
    
    // 静止保活上报的定时器句柄。
    forceUploadTimer: null,

    // 错误收敛和提示状态。
    lastUserFacingErrorKey: '',
    lastUserFacingErrorAt: 0,
    lastLocationErrorLogKey: '',
    lastLocationErrorLogAt: 0,
    lastReportErrorLogKey: '',
    lastReportErrorLogAt: 0,
    pendingRetryNotBefore: 0,
    // 当前这次“定位被阻断”的原因。
    // 只要恢复定位成功，就清空。
    locationBlockedReason: '',
    // 当前这一次阻断周期里，是否已经记录过“需要开启定位”的提示。
    // 这个值不是永久的，只对当前这次阻断生效。
    hasPromptedForCurrentBlock: false,
    //#endregion
  };

  let isForceUploading = false;

  function shouldAllowByCooldown(key, lastKeyField, lastAtField, cooldownMs) {
    const currentTime = now();
    return state[lastKeyField] !== key || currentTime - state[lastAtField] >= cooldownMs;
  }

  function consumeCooldown(key, lastKeyField, lastAtField, cooldownMs) {
    if (!shouldAllowByCooldown(key, lastKeyField, lastAtField, cooldownMs)) {
      return false;
    }

    state[lastKeyField] = key;
    state[lastAtField] = now();
    return true;
  }
  // 记录一次“需要开启定位”的提示，并统一引导用户去设置页补齐定位权限。
  async function promptEnableLocationService(classification) {
    const promptKey = `location-service:${classification}`;
    // 冷却时间内，同类提示不重复记录，避免日志刷屏。
    if (!consumeCooldown(
      promptKey,
      'lastUserFacingErrorKey',
      'lastUserFacingErrorAt',
      USER_FACING_ERROR_COOLDOWN_MS
    )) {
      return false;
    }

    logger.warn('[location-user-action-needed]', {
      classification,
      message: LOCATION_SERVICE_DISABLED_MESSAGE,
      timestamp: now(),
    });

    try {
      await requestOpenSetting(
        LOCATION_SERVICE_DISABLED_MESSAGE,
        BACKGROUND_LOCATION_REQUIRED_SCOPES,
      );
      return true;
    } catch (error) {
      logger.warn('[location-open-setting-cancelled]', {
        classification,
        errMsg: getErrorMessage(error),
      });
      return false;
    }
  }
  
  // 把待重试 payload 写到内存和本地缓存。
  function persistPendingPayload(payload) {
    // 先更新内存里的状态。
    state.pendingPayload = payload;
    
    // 再更新本地缓存；payload 为空时写空字符串，相当于清空。
    uniApi.setStorageSync(
      PENDING_REPORT_STORAGE_KEY,
      payload ? JSON.stringify(payload) : ''
    );
  }
  
  // 保存最近一次成功上报的时间。
  function persistLastReportedAt(timestamp) {
    // 更新内存状态。
    state.lastReportedAt = timestamp;
    
    // 更新本地缓存，下次打开小程序还能记得。
    uniApi.setStorageSync(LAST_REPORT_STORAGE_KEY, timestamp);
  }
  
  // 统一打印定位错误。
  function handleLocationError(error) {
    // 这里不 throw，只记录错误，避免定位失败影响主流程。
    logger.error('[location-error]', {
      errMsg: getErrorMessage(error),
      errCode: error?.errCode || error?.code || '',
      raw: error,
    });
  }
  
  // 检查 payload 是否具备后端必要字段。 || 本轮是否只弹一次
  function handleManagedLocationError(error) {
    const errMsg = getErrorMessage(error);
    const errCode = error?.errCode || error?.code || '';
    //定性错误原因
    const classification = classifyLocationError(error);
    const logKey = `location:${classification}:${errCode || errMsg}`;

    if (shouldPromptLocationIssue(classification)) {
      // 只有当阻断原因发生变化时，才认为进入了新的阻断周期。
      const isNewBlockedCycle = state.locationBlockedReason !== classification;
      
      if (isNewBlockedCycle) {
        state.locationBlockedReason = classification;
        // 新的一轮阻断，允许再次弹提示。
        state.hasPromptedForCurrentBlock = false;
      }
      // 当前这轮阻断里，如果还没弹过，就弹一次。
      if (!state.hasPromptedForCurrentBlock) {
        void promptEnableLocationService(classification);
        state.hasPromptedForCurrentBlock = true;
      }
    }

    if (!consumeCooldown(
      logKey,
      'lastLocationErrorLogKey',
      'lastLocationErrorLogAt',
      LOCATION_ERROR_LOG_COOLDOWN_MS
    )) {
      return;
    }

    logger.error('[location-error]', {
      classification,
      errMsg,
      errCode,
      raw: error,
    });
  }

  function isValidPayload(payload) {
    // entityId、经纬度、定位时间、客户端时间都必须存在。
    return Boolean(payload?.entityId)
      && payload.lng !== null
      && payload.lat !== null
      && Boolean(payload.trackTime)
      && Boolean(payload.clientTime);
  }
  
  // 真正提交一次定位 payload。
  async function submitPayload(payload, metadata = {}) {
    // 上报前打印一次，方便调试看到上报内容。
    logger.log('[location-report]', payload);
    
    try {
      // 调用外部传入的后端接口。
      await submitLocationReport(payload);
      
      // 成功后清掉待重试数据。
      persistPendingPayload(null);
      state.pendingRetryNotBefore = 0;
      
      // 成功后刷新最后成功上报时间。
      persistLastReportedAt(now());
      
      // 打成功日志。
      logger.log('[location-report-success]', payload);
      
      // 返回 true，表示这次提交成功。
      return true;
    } catch (error) {
      // 失败时把当前 payload 存起来，下次再重试。
      persistPendingPayload(payload);
      state.pendingRetryNotBefore = now() + PENDING_RETRY_COOLDOWN_MS;
      const classification = classifyReportError(error);
      const errMsg = getErrorMessage(error);
      const logKey = `report:${classification}:${errMsg}`;
      
      // 打失败日志，并标记这次是不是重试。
      if (consumeCooldown(
        logKey,
        'lastReportErrorLogKey',
        'lastReportErrorLogAt',
        REPORT_ERROR_LOG_COOLDOWN_MS
      )) {
        logger.warn('[location-report-error]', {
          classification,
          errMsg,
          raw: error,
          payload,
          isRetry: Boolean(metadata.isRetry),
        });
      }
      
      // 返回 false，表示这次提交失败。
      return false;
    }
  }
  
  // 如果本地有上次失败的数据，就先补报它。
  async function flushPendingPayload() {
    // 没有待重试数据时，直接认为成功。
    if (!state.pendingPayload) {
      return true;
    }
    
    // 有待重试数据时，拿它再提交一次。
    if (state.pendingRetryNotBefore && now() < state.pendingRetryNotBefore) {
      return false;
    }

    return submitPayload(state.pendingPayload, { isRetry: true });
  }
  
  // 处理一次定位结果。启动时 getLocation 和后台定位变化都会走这里。
  //FIXME:这个非常有必要，后台定位变化不一定马上触发，uni.onLocationChange(handleLocationChange) 它通常要等系统认为“位置变化了”，才会回调
  async function handleLocationChange(location, source = 'location-change') {
    const locationTime = now();
    state.lastSystemLocationTime = locationTime;
    
    if (state.locationBlockedReason && hasUsableLocationCoordinates(location)) {
      // 一旦重新拿到有效定位，说明这次阻断已经恢复。
      state.locationBlockedReason = '';
      // 恢复后，下次如果又关闭定位服务，需要允许再次弹提示。
      state.hasPromptedForCurrentBlock = false;
    }

    // 打印原始定位数据，方便对照 uni 返回了什么。
    logger.log('[location-raw]', location);
    logger.log('[location-coordinate-transform]', {
      source,
      ...buildLocationCoordinateDebugInfo(location),
    });
    
    // 记录处理前是否存在待重试数据。
    const hasPendingPayload = Boolean(state.pendingPayload);
    
    // 每次有新定位时，先尝试补报旧失败数据。
    const pendingFlushed = await flushPendingPayload();
    
    // 如果旧失败数据补报失败，本次新定位先不报，避免顺序混乱。
    if (hasPendingPayload && !pendingFlushed) {
      return false;
    }
    
    // 获取当前时间，用于 payload 时间字段。
    const currentTime = now();
    
    // 把 uni 定位结果整理成后端需要的字段。
    const payload = buildLocationReportPayload(location, {
      entityId: getEntityId(),
      type: getType(),
      reportedAt: currentTime,
      locationTime,
      source,
    });
    
    // 如果缺少必要字段，就不提交。
    if (!isValidPayload(payload)) {
      logger.warn('[location-report-skip]', {
        reason: 'missing required track fields',
        payload,
      });
      return false;
    }
    
    // 字段合法时，提交给后端。
    return submitPayload(payload);
  }
  
  // 系统定位沉默时，主动采集一次当前位置作为在线心跳。
  async function checkAndForceUpload() {
    if (isForceUploading) {
      return false;
    }

    if (state.locationBlockedReason) {
      return false;
    }

    const silentTime = now() - state.lastSystemLocationTime;

    if (silentTime <= 3000) {
      return false;
    }

    isForceUploading = true;

    try {
      logger.log('[location-force-upload]', {
        silentTime,
        timestamp: now(),
      });

      // getLocation 是一次性定位，不是持续监听。
      const location = await callUniApi(uniApi, 'getLocation', {
        type: 'gcj02',
        isHighAccuracy: true,
        altitude: true,
      });

      if (!state.isStarted) {
        return false;
      }

      return handleLocationChange(location, 'forced-5s-polling');
    } catch (error) {
      handleManagedLocationError(error);
      if (shouldPromptLocationIssue(classifyLocationError(error))) {
        throw error;
      }
      return false;
    } finally {
      isForceUploading = false;
    }
  }

  // 启动静止保活定时器；重复启动前会先清理旧定时器。
  function startForceUploadTimer() {
    if (state.forceUploadTimer) {
      clearInterval(state.forceUploadTimer);
    }

    state.forceUploadTimer = setInterval(checkAndForceUpload, 5000);
  }

  // 清理静止保活定时器。
  function clearForceUploadTimer() {
    if (!state.forceUploadTimer) {
      return;
    }

    clearInterval(state.forceUploadTimer);
    state.forceUploadTimer = null;
  }

  // 绑定后台定位变化和定位错误监听。
  function bindLocationListeners() {
    // 防止重复绑定 onLocationChange。
    if (!state.locationChangeHandler) {
      // 保存函数引用，后面 offLocationChange 才能解绑同一个函数。
      state.locationChangeHandler = (location) => handleLocationChange(location);
      
      // 当微信小程序后台定位变化时，会回调这个函数。
      uniApi.onLocationChange(state.locationChangeHandler);
    }
    
    // 有些平台支持定位错误监听，支持时才绑定。
    if (!state.locationErrorHandler && typeof uniApi.onLocationChangeError === 'function') {
      // 保存错误监听函数引用。
      state.locationErrorHandler = (error) => handleManagedLocationError(error);
      
      // 绑定定位错误监听。
      uniApi.onLocationChangeError(state.locationErrorHandler);
    }
  }
  
  // 解绑后台定位监听，通常 stop 或启动失败时会调用。
  function unbindLocationListeners() {
    // 如果之前绑定过定位变化监听，并且当前环境支持解绑，就解绑。
    if (state.locationChangeHandler && typeof uniApi.offLocationChange === 'function') {
      uniApi.offLocationChange(state.locationChangeHandler);
    }
    
    // 如果之前绑定过定位错误监听，并且当前环境支持解绑，就解绑。
    if (state.locationErrorHandler && typeof uniApi.offLocationChangeError === 'function') {
      uniApi.offLocationChangeError(state.locationErrorHandler);
    }
    
    // 清空函数引用，表示当前没有绑定监听。
    state.locationChangeHandler = null;
    state.locationErrorHandler = null;
  }

  // 这一段统一处理权限状态判断，避免前台定位和后台定位各自写一套 scope 校验。
  function hasGrantedScopes(authSetting = {}, requiredScopes = []) {
    return requiredScopes.every((scope) => authSetting?.[scope] === true);
  }

  function logBackgroundPermissionDenied(error) {
    logger.warn('[location-background-permission-denied]', {
      timestamp: now(),
      errMsg: error ? getErrorMessage(error) : '',
    });
  }
  
  // 引导用户打开小程序设置页，补齐定位权限。
  async function requestOpenSetting(content, requiredScopes = [USER_LOCATION_SCOPE]) {
    // 打日志，说明现在准备引导用户去设置页。
    logger.warn('[location-open-setting]', {
      content,
      timestamp: now(),
    });
    
    // 先弹窗问用户要不要去设置。
    const modalRes = await callUniApi(uniApi, 'showModal', {
      title: '需要定位',
      content,
      confirmText: '去设置',
      cancelText: '取消',
    });
    
    // 用户点取消时，直接抛错，start 会捕获并返回 false。
    if (!modalRes?.confirm) {
      throw new Error('User cancelled location authorization');
    }
    
    // 用户点确认后，打开小程序设置页。
    const settingRes = await callUniApi(uniApi, 'openSetting');
    
    // 读取设置页返回的权限结果。
    const authSetting = settingRes?.authSetting || {};
    
    // openSetting 返回后必须重新校验必需权限，避免用户没有真正打开。
    if (!hasGrantedScopes(authSetting, requiredScopes)) {
      throw new Error('Incomplete location authorization');
    }
  }

  async function getAuthSetting() {
    const setting = await callUniApi(uniApi, 'getSetting');
    return setting?.authSetting || {};
  }

  async function ensureForegroundLocationPermission() {
    const authSetting = await getAuthSetting();
    
    if (authSetting[USER_LOCATION_SCOPE] === true) {
      return;
    }
    
    if (authSetting[USER_LOCATION_SCOPE] === false) {
      await requestOpenSetting(FOREGROUND_LOCATION_PERMISSION_MESSAGE, [USER_LOCATION_SCOPE]);
      return;
    }
    
    await callUniApi(uniApi, 'authorize', {
      scope: USER_LOCATION_SCOPE,
    });
  }

  async function ensureBackgroundLocationPermission() {
    const authSetting = await getAuthSetting();
    
    if (authSetting[BACKGROUND_LOCATION_SCOPE] === true) {
      return;
    }
    
    if (authSetting[BACKGROUND_LOCATION_SCOPE] === false) {
      logBackgroundPermissionDenied();
      await requestOpenSetting(BACKGROUND_LOCATION_PERMISSION_MESSAGE, BACKGROUND_LOCATION_REQUIRED_SCOPES);
      return;
    }
    
    try {
      await callUniApi(uniApi, 'authorize', {
        scope: BACKGROUND_LOCATION_SCOPE,
      });
    } catch (error) {
      logBackgroundPermissionDenied(error);
      await requestOpenSetting(BACKGROUND_LOCATION_PERMISSION_MESSAGE, BACKGROUND_LOCATION_REQUIRED_SCOPES);
    }
  }
  
  // 启动定位前，按微信要求先确认前台定位，再确认后台定位。
  async function ensureLocationPermissions() {
    await ensureForegroundLocationPermission();
    await ensureBackgroundLocationPermission();
  }
  
  // 启动成功后，主动采集一次当前位置。
  async function captureInitialLocation() {
    try {
      // getLocation 是一次性定位，不是持续监听。
      const location = await callUniApi(uniApi, 'getLocation', {
        type: 'gcj02',
        isHighAccuracy: true,
        altitude: true,
      });
      
      // 把这次主动定位结果交给统一处理函数。
      await handleLocationChange(location, 'getLocation');
      return true;
    } catch (error) {
      // 一次性定位失败不阻断服务，只记录错误。
      handleManagedLocationError(error);
      if (shouldPromptLocationIssue(classifyLocationError(error))) {
        throw error;
      }
      return false;
    }
  }
  
  // 开启微信小程序后台持续定位。
  async function startBackgroundLocationUpdates() {
    try {
      // 这是微信小程序后台定位的核心 API。
      await callUniApi(uniApi, 'startLocationUpdateBackground');
      
      // 启动成功后打日志。
      logger.log('[location-background-started]', {
        timestamp: now(),
      });
    } catch (error) {
      const errMsg = getErrorMessage(error);

      logger.warn('[location-background-start-failed]', {
        timestamp: now(),
        errMsg,
        raw: error,
      });
      
      if (errMsg.includes('auth deny')) {
        logger.warn('[location-background-permission-denied]', {
          timestamp: now(),
          errMsg,
        });

        await requestOpenSetting(
          BACKGROUND_LOCATION_PERMISSION_MESSAGE,
          BACKGROUND_LOCATION_REQUIRED_SCOPES,
        );
      }

      throw error;
    }
  }
  
  // 对外暴露的启动方法：登录后或 App onShow 时调用。
  async function start() {
    // 打启动日志，方便排查有没有进入定位流程。
    logger.log('[location-start]', {
      source: 'location-reporter',
      timestamp: now(),
    });
    
    // 如果已经启动过，直接返回 true，避免重复启动。
    if (state.isStarted) {
      return true;
    }
    
    // 如果正在启动中，直接复用同一个 Promise，避免并发启动。
    if (state.startPromise) {
      return state.startPromise;
    }
    
    // 保存启动 Promise，直到启动流程结束。
    state.startPromise = (async() => {
      // 当前环境不支持后台定位时，直接返回 false。
      if (typeof uniApi.startLocationUpdateBackground !== 'function') {
        logger.warn('[location-unsupported]');
        return false;
      }
      
      // 第一步：检查和申请定位权限。
      await ensureLocationPermissions();
      
      // 第二步：绑定定位变化监听。
      bindLocationListeners();
      
      // 第三步：开启后台持续定位。
      await startBackgroundLocationUpdates();
      
      // 能走到这里，说明服务已经启动。
      state.isStarted = true;

      // 启动静止保活检查：系统沉默超过 3 秒时，每 5 秒主动补一次定位。
      startForceUploadTimer();

      // 第四步：先补报上次失败的定位。
      const pendingFlushed = await flushPendingPayload();
      
      // 如果补报失败，也认为服务启动成功，只是暂时不采集新点。
      if (!pendingFlushed) {
        return true;
      }
      
      // 第五步：主动采集一次当前位置，保证尽快有一条定位。
      await captureInitialLocation();
      
      // 返回 true 表示启动成功。
      return true;
    })().catch((error) => {
      // 启动失败时，把状态改回未启动。
      state.isStarted = false;

      // 启动失败时清理保活定时器，避免半启动状态继续主动定位。
      clearForceUploadTimer();

      // 启动失败时解绑监听，避免半启动状态。
      unbindLocationListeners();
      
      // 记录启动失败原因。
      handleManagedLocationError(error);
      
      // 返回 false，让调用方知道启动失败。
      return false;
    }).finally(() => {
      // 启动流程结束后，清空 startPromise。
      state.startPromise = null;
    });
    
    // 返回启动 Promise，外部可以 await。
    return state.startPromise;
  }
  
  // 对外暴露的停止方法：退出登录时调用。
  function stop(options = {}) {
    clearForceUploadTimer();
    // 停止时清掉本轮阻断状态，避免影响下次重新启动。
    state.locationBlockedReason = '';
    state.hasPromptedForCurrentBlock = false;
    state.pendingRetryNotBefore = 0;

    // silent=true 表示停止时不要打印普通 stop 日志。
    const { silent = false } = options;
    
    // 如果当前环境支持停止定位，就调用 stopLocationUpdate。
    if (typeof uniApi.stopLocationUpdate === 'function') {
      uniApi.stopLocationUpdate({
        // 停止失败不抛错，只打 warning。
        fail: (error) => {
          logger.warn('[location-stop-fail]', error);
        },
      });
    }
    
    // 解绑定位监听，避免退出登录后还继续处理定位回调。
    unbindLocationListeners();
    
    // 标记服务已经停止。
    state.isStarted = false;
    
    // 非静默模式下打印停止日志。
    if (!silent) {
      logger.log('[location-stop]', {
        time: now(),
      });
    }
  }
  
  // 返回给外部使用的 API。
  return {
    // 开启定位上报。
    start,
    
    // 停止定位上报。
    stop,
    
    // 暴露给测试或特殊手动补报场景，正常业务一般不用直接调。
    handleLocationChange,
  };
}
