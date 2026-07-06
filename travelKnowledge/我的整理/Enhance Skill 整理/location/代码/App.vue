<template >
  <slot />
</template >

<script setup >
import { ref, onBeforeUnmount } from 'vue'
import { onLaunch, onShow, onUnload } from '@dcloudio/uni-app'
import { useAccountStore } from '@/store'
import { ensureCurrentPageAuth, hasAuthToken } from '@/utils/auth-guard.js'
import { preventScreenShot } from '@travel/api'
import {
  shouldResumeLocationReporter,
  startLocationReporter,
} from '@/services/locationReporterRuntime.js'

const captureHandler = ref(null)
const recordHandler = ref(null)
const userId = uni.getStorageSync('userId') || ''

const uploadAuditLog = async(type) => {
  console.log('[screen-audit]', type)
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  let deviceInfoStr = ''

  try {
    const deviceInfo = await wx.getDeviceInfo()
    deviceInfoStr = `${deviceInfo.platform} ${deviceInfo.system} ${deviceInfo.model}`
  } catch {
    deviceInfoStr = 'unknown-device'
  }

  const reqData = {
    userId,
    operateType: type,
    pagePath: currentPage?.route || '',
    operateTime: Date.now(),
    deviceInfo: deviceInfoStr,
  }

  try {
    await preventScreenShot(reqData)
    console.log('[screen-audit-success]', reqData)
  } catch (err) {
    console.error('[screen-audit-fail]', err)
  }
}

const initScreenProtect = () => {
  console.log('=== init screen protect ===')
  destroyScreenProtect()

  captureHandler.value = () => {
    console.log('[screen-capture-detected]')
    uploadAuditLog('capture')
  }
  wx.onUserCaptureScreen(captureHandler.value)
  console.log('[screen-capture-listener-registered]')

  try {
    wx.setVisualEffectOnCapture({
      visualEffect: 'hidden',
      success: () => console.log('[capture-hidden-enabled]'),
      fail: (err) => console.warn('[capture-hidden-fail]', err),
    })
  } catch (e) {
    console.error('[capture-hidden-error]', e)
  }

  if (wx.onScreenRecordingStateChanged) {
    recordHandler.value = (res) => {
      if (res.state === 'start') {
        console.log('[screen-recording-detected]')
        uploadAuditLog('record')
      }
    }
    wx.onScreenRecordingStateChanged(recordHandler.value)
    console.log('[screen-record-listener-registered]')
  }
}

const destroyScreenProtect = () => {
  if (captureHandler.value) {
    wx.offUserCaptureScreen(captureHandler.value)
    captureHandler.value = null
  }
  if (recordHandler.value) {
    wx.offScreenRecordingStateChanged(recordHandler.value)
    recordHandler.value = null
  }
}

const resumeVehicleState = async(reload = false) => {
  const accountStore = useAccountStore()

  if (!hasAuthToken()) {
    return
  }

  try {
    await accountStore.getSystemInfo(reload)
  } catch (error) {
    console.error('load login info failed', error)
  }

  if (shouldResumeLocationReporter()) {
    try {
      await startLocationReporter()
    } catch (error) {
      console.error('resume location reporter failed', error)
    }
  }

  // Resume vehicle approval polling or vehicle tracking from loginInfo/cache.
  await accountStore.resumeVehicleLocation()
    .catch((error) => {
      console.error('resume vehicle location failed', error)
    })
}

onLaunch(() => {
  if (!ensureCurrentPageAuth() || !hasAuthToken()) return
  resumeVehicleState(true)
})

onShow(async() => {
  if (!ensureCurrentPageAuth()) return
  initScreenProtect()

  if (!hasAuthToken()) {
    return
  }

  // Resume vehicle state after loginInfo has been synced.
  await resumeVehicleState()
})

onUnload(() => {
  destroyScreenProtect()
})

onBeforeUnmount(() => {
  destroyScreenProtect()
})
</script >

<style scoped >
page {
  background-color: #F8FAFC !important;
}
</style >
