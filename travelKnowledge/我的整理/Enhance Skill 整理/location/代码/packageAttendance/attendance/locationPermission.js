/*
权限层 / 一次性取定位层 / 打卡前先确认有没有定位权限，然后拿当前坐标
*/

const LOCATION_PERMISSION_MESSAGE = '定位失败，请开启定位权限';


function callUniApi(methodName, options = {}) {
  //包成 Promise，方便统一用 async/await
  return new Promise((resolve, reject) => {
    const method = uni?.[methodName];

    if (typeof method !== 'function') {
      reject(new Error(`Current environment does not support ${methodName}`));
      return;
    }

    method({
      ...options,
      success: resolve,
      fail: reject,
    });
  });
}

//https://uniapp.dcloud.net.cn/api/other/setting.html#getsetting
//https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/authorize.html?f_link_type=f_linkinlinenote&flow_extra=eyJpbmxpbmVfZGlzcGxheV9wb3NpdGlvbiI6MCwiZG9jX3Bvc2l0aW9uIjowLCJkb2NfaWQiOiI1ZGRkNmM2NDQ2Y2JlN2U4LTMwNzkwMmEwNzM4MzY1NTkifQ%3D%3D
//对应 uni.chooseLocation / uni.getLocation || 前台定位授权key
const USER_LOCATION_SCOPE = 'scope.userLocation';

async function getAuthSetting() {
  //三种状态： undefined 用户未选择 / true 用户已同意 / false 用户决绝了定位 - 会永久屏蔽弹窗
  const setting = await callUniApi('getSetting');
  return setting?.authSetting || {};
}

async function openLocationSetting() {
  //没有 authSetting['scope.location'] 权限的提示弹窗
  const modalRes = await callUniApi('showModal', {
    title: '提示',
    content: '需要获取位置权限才能打卡',
    confirmText: '去设置',
    cancelText: '取消',
  });

  if (!modalRes?.confirm) {
    throw new Error(LOCATION_PERMISSION_MESSAGE);
  }

  const settingRes = await callUniApi('openSetting');
  const authSetting = settingRes?.authSetting || {};

  if (authSetting[USER_LOCATION_SCOPE] !== true) {
    throw new Error(LOCATION_PERMISSION_MESSAGE);
  }
}

export async function ensureUserLocationPermission() {
  const authSetting = await getAuthSetting();

  if (authSetting[USER_LOCATION_SCOPE] === true) {
    return;
  }

  //只有授权被用户拒绝 getAuthSetting 中的三种状态之一，则弹出弹窗
  if (authSetting[USER_LOCATION_SCOPE] === false) {
    await openLocationSetting();
    return;
  }

  try {
    await callUniApi('authorize', {
      scope: USER_LOCATION_SCOPE,
    });
  } catch {
    await openLocationSetting();
  }
}

//FIX: 信号不稳定时的 toast 提示

const LOCATION_TOAST_COOLDOWN_MS = 30 * 1000;
let lastLocationToastAt = 0;

function showLocationToast() {
  const now = Date.now();

  // 30 秒内最多提示一次，避免信号不好时一直弹
  if (now - lastLocationToastAt < LOCATION_TOAST_COOLDOWN_MS) {
    return;
  }

  lastLocationToastAt = now;

  uni.showToast({
    title: '当前定位不稳定，请稍后重试',
    icon: 'none',
    duration: 2000,
  });
}

export async function getCurrentLocationWithPermission(options = {}) {
  //问小程序有没有 scope.userLocation 权限，但是不管用户点击了弹窗的 同意 or 拒绝 (微信内授权)
  await ensureUserLocationPermission();

  //(手机系统定位权限)
  try {
    // 再真正获取当前坐标
    return await callUniApi('getLocation', {
      type: 'gcj02',
      isHighAccuracy: true,
      ...options,
    });
  } catch (error) {
    // 因为你现在处理的是手机系统定位失败 / 信号差 / 超时 / 网络波动
    // 但是这是一次性的
    showLocationToast();
    throw error;
  }
}
