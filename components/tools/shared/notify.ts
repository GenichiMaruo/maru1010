// デスクトップ通知。iOS Safari（ホーム画面に追加していない場合）には Notification 自体がないので、必ず存在確認する

export function requestNotificationPermission() {
  if (typeof Notification === "undefined" || Notification.permission !== "default") return;
  try {
    void Notification.requestPermission();
  } catch {}
}

/** タブが裏にあるときだけ通知する（見ている画面ではアラーム表示で十分なため） */
export function notifyIfHidden(message: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted" || !document.hidden) return;
  try {
    new Notification(message);
  } catch {}
}
