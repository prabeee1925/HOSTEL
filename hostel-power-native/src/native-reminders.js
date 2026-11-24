import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';

const native = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();
const DAYS_AHEAD = 8; // 8 * 7 = 56 pending notices; keeps below iOS's 64-notification limit.
const OFFSETS = [-5, 0, 2, 4, 6, 8, 10];
const STORAGE_PREFIX = 'hostelNativeReminderIds:';
const TONE_STORAGE_KEY = 'hostelAlarmTone';

// Original short WAV tones are bundled with both native builds.
const TONES = {
  classic: {
    id: 'classic', label: 'Classic Bell', file: 'hostel_classic.wav', resource: 'hostel_classic', channelId: 'hostel_reminders_classic'
  },
  digital: {
    id: 'digital', label: 'Digital Beep', file: 'hostel_digital.wav', resource: 'hostel_digital', channelId: 'hostel_reminders_digital'
  },
  double: {
    id: 'double', label: 'Double Chime', file: 'hostel_double_chime.wav', resource: 'hostel_double_chime', channelId: 'hostel_reminders_double'
  },
  gentle: {
    id: 'gentle', label: 'Gentle Chime', file: 'hostel_gentle.wav', resource: 'hostel_gentle', channelId: 'hostel_reminders_gentle'
  },
  custom: {
    id: 'custom', label: 'My Custom Tone', file: 'hostel_custom.wav', resource: 'hostel_custom', channelId: 'hostel_reminders_custom'
  }
};

function getToneId() {
  try {
    const id = localStorage.getItem(TONE_STORAGE_KEY) || 'classic';
    return Object.prototype.hasOwnProperty.call(TONES, id) ? id : 'classic';
  } catch {
    return 'classic';
  }
}

function getTone() {
  return TONES[getToneId()];
}

function storageKey(studentKey) {
  return STORAGE_PREFIX + String(studentKey || '');
}

function getSavedIds(studentKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(studentKey)) || '[]');
    return Array.isArray(parsed) ? parsed.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

function saveIds(studentKey, ids) {
  try { localStorage.setItem(storageKey(studentKey), JSON.stringify(ids)); } catch { /* optional cache */ }
}

function dayStamp(date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

// Capacitor notification IDs must be positive 32-bit integers.
function notificationId(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2147483646 + 1;
}

async function ensureAndroidChannel(tone = getTone()) {
  if (platform !== 'android') return;
  try {
    await LocalNotifications.createChannel({
      id: tone.channelId,
      name: `Hostel Power · ${tone.label}`,
      description: `Hostel Power leaving-time reminders using the ${tone.label} ringtone.`,
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: tone.resource
    });
  } catch (error) {
    // Android channels are immutable after their first creation. Each tone has its own stable channel.
  }
}

async function enable() {
  if (!native) {
    return { ok: false, message: 'Install the Android/iPhone app build to use device-scheduled alarms.' };
  }

  let permission = await LocalNotifications.checkPermissions();
  if (permission.display !== 'granted') {
    permission = await LocalNotifications.requestPermissions();
  }
  if (permission.display !== 'granted') {
    return { ok: false, message: 'Notifications are not allowed. Enable them in this app’s phone settings.' };
  }

  await ensureAndroidChannel();

  if (platform === 'android') {
    try {
      let exact = await LocalNotifications.checkExactNotificationSetting();
      if (exact.exact_alarm !== 'granted') {
        await LocalNotifications.changeExactNotificationSetting();
        exact = await LocalNotifications.checkExactNotificationSetting();
      }
      if (exact.exact_alarm !== 'granted') {
        return { ok: false, message: 'Please enable “Alarms & reminders” for Hostel Power in Android settings, then tap Enable again.' };
      }
    } catch (error) {
      return { ok: false, message: 'Android could not confirm exact-alarm permission. Check the “Alarms & reminders” setting and try again.' };
    }
  }

  return { ok: true, platform, tone: getTone().label };
}

async function cancel(studentKey) {
  if (!native || !studentKey) return;
  const ids = getSavedIds(studentKey);
  if (ids.length) {
    try {
      await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
    } catch (error) {
      // Already-fired notifications are harmless; best effort cancellation of pending reminders.
    }
  }
  saveIds(studentKey, []);
}

async function cancelToday(studentKey) {
  if (!native || !studentKey) return;
  const today = dayStamp(new Date());
  const ids = OFFSETS.map(offset => notificationId(`${studentKey}|${today}|${offset}`));
  try {
    await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
  } catch { /* Some of today's reminders may already have fired. */ }
  const remaining = getSavedIds(studentKey).filter(id => !ids.includes(id));
  saveIds(studentKey, remaining);
}

function makeNotifications(student, tone) {
  const now = new Date();
  const [hour, minute] = String(student.leaveTime).split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return [];

  const notifications = [];
  for (let day = 0; day < DAYS_AHEAD; day++) {
    const leaving = new Date(now);
    leaving.setDate(now.getDate() + day);
    leaving.setHours(hour, minute, 0, 0);

    OFFSETS.forEach((offset, index) => {
      const at = new Date(leaving.getTime() + offset * 60_000);
      if (at.getTime() <= Date.now() + 5000) return;

      let body;
      if (offset === -5) body = 'You leave in 5 minutes. Check the room light and fan.';
      else if (offset === 0) body = 'It is your leaving time. Switch OFF the light and fan before leaving.';
      else body = `Reminder ${index - 1}: check whether the room light and fan are OFF.`;

      const notification = {
        id: notificationId(`${student.key}|${dayStamp(leaving)}|${offset}`),
        title: `Hostel Power · Room ${student.room}`,
        body,
        schedule: { at, allowWhileIdle: false },
        extra: { studentKey: student.key, room: student.room, offset, tone: tone.id }
      };
      if (platform === 'android') notification.channelId = tone.channelId;
      if (platform === 'ios') notification.sound = tone.file;
      notifications.push(notification);
    });
  }
  return notifications;
}

async function schedule(student) {
  if (!native) {
    return { ok: false, message: 'These reminders require the installed Android/iPhone app, not the browser website.' };
  }
  if (!student || !student.key || !student.leaveTime) {
    return { ok: false, message: 'Choose a leaving time first.' };
  }

  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== 'granted') {
    return { ok: false, message: 'Tap “Enable / check phone alarms” and allow notifications first.' };
  }

  const tone = getTone();
  await ensureAndroidChannel(tone);
  const notifications = makeNotifications(student, tone);
  await cancel(student.key);
  if (!notifications.length) {
    return { ok: false, message: 'The leaving time has already passed today. Reminders will start tomorrow.' };
  }

  const result = await LocalNotifications.schedule({ notifications });
  saveIds(student.key, notifications.map(item => item.id));
  const warning = result && Array.isArray(result.warnings) && result.warnings.length
    ? ' Android reported a timing warning; check exact-alarm permission.' : '';
  return { ok: true, count: notifications.length, tone: tone.label, message: `Scheduled ${notifications.length} device reminders using ${tone.label}.${warning}` };
}

async function test() {
  if (!native) return { ok: false, message: 'Test alarms are available in the installed Android/iPhone app.' };
  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== 'granted') {
    return { ok: false, message: 'Enable phone notifications first.' };
  }
  const tone = getTone();
  await ensureAndroidChannel(tone);
  const id = notificationId(`test|${Date.now()}`);
  const notification = {
    id,
    title: 'Hostel Power test alarm',
    body: `Your selected ringtone is ${tone.label}. Your phone notifications are working.`,
    schedule: { at: new Date(Date.now() + 5000) },
    extra: { test: true, tone: tone.id }
  };
  if (platform === 'android') notification.channelId = tone.channelId;
  if (platform === 'ios') notification.sound = tone.file;
  await LocalNotifications.schedule({ notifications: [notification] });
  return { ok: true, tone: tone.label };
}

if (native) {
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) window.dispatchEvent(new Event('hostel-native-resume'));
  }).catch(() => {});
}

window.HostelNativeReminders = {
  isNative: native,
  platform,
  tones: Object.values(TONES).map(({ id, label, file }) => ({ id, label, file })),
  getToneId,
  enable,
  schedule,
  cancel,
  cancelToday,
  test
};

// Tell the existing page once the native bridge is ready to use.
window.dispatchEvent(new Event('hostel-native-ready'));
