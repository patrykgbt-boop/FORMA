// Public Expo project UUID; keep aligned with GitHub Actions and the Expo dashboard.
const projectId = '070ad17e-2d91-4253-be1f-bd0075a777de';
if (process.env.EXPO_EAS_PROJECT_ID && process.env.EXPO_EAS_PROJECT_ID !== projectId) {
  throw new Error('EXPO_EAS_PROJECT_ID does not match the configured FORMA Sleep Expo project.');
}
module.exports = ({config}) => ({
  ...config,
  runtimeVersion: 'forma-sleep-android-runtime-1',
  updates: {
    enabled: true,
    url: `https://u.expo.dev/${projectId}`,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
    requestHeaders: {'expo-channel-name': 'production'}
  },
  extra: {...config.extra, eas: {...config.extra?.eas, projectId}}
});
