// GitHub Actions: repository variable EXPO_EAS_PROJECT_ID is set after one-time Expo setup.
// Without this variable the existing APK may run, but remote updates are intentionally disabled.
const projectId = (process.env.EXPO_EAS_PROJECT_ID || '').trim();
if (projectId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
  throw new Error('EXPO_EAS_PROJECT_ID musi być UUID projektu Expo.');
}
module.exports = ({config}) => ({
  ...config,
  runtimeVersion: 'forma-sleep-android-runtime-1',
  updates: projectId ? {
    enabled: true,
    url: `https://u.expo.dev/${projectId}`,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
    requestHeaders: {'expo-channel-name': 'production'}
  } : {enabled: false},
  extra: {
    ...config.extra,
    ...(projectId ? {eas: {projectId}} : {})
  }
});
