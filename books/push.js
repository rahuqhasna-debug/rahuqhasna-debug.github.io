// إشعارات الموبايل (OneSignal) — بتشتغل لما ONESIGNAL_APP_ID يتحط في config.js. لحد كده مفيش حاجة بتحصل.
(function () {
  const C = window.SILAH_CONFIG || {};
  if (!C.ONESIGNAL_APP_ID) return;
  // هيتكمل في خطوة الإشعارات
})();
