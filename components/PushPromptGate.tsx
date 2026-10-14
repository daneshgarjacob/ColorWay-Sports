"use client";

import { useEffect } from "react";
import { sessionPromptOwner } from "@/lib/promptGate";

const ONESIGNAL_SDK = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
const ONESIGNAL_APP_ID = "28c90f83-e544-4a72-a8b2-660a8d94c840";

type OneSignalInit = (os: { init: (o: { appId: string }) => Promise<void> }) => Promise<void> | void;

// OneSignal web push (free plan), loaded only when it is allowed to run.
//
// The subscribe slidedown is configured in the OneSignal dashboard (45 seconds
// into a reader's first article) and fires as soon as OneSignal.init() runs, so
// the only reliable way to keep it out of a session is not to init there. Init
// happens when:
//   - this session belongs to push (see lib/promptGate.ts: the newsletter has
//     stopped asking this reader), or
//   - the reader already answered the browser permission (granted or denied).
//     No prompt can show then, and init keeps an existing subscriber's
//     OneSignal record current.
// Otherwise the SDK is never even downloaded, which also saves the transfer.
// Worker file: public/OneSignalSDKWorker.js.
export default function PushPromptGate() {
  useEffect(() => {
    const answered =
      typeof Notification !== "undefined" && Notification.permission !== "default";
    if (!answered && sessionPromptOwner() !== "push") return;

    const w = window as unknown as { OneSignalDeferred?: OneSignalInit[] };
    w.OneSignalDeferred = w.OneSignalDeferred || [];
    w.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({ appId: ONESIGNAL_APP_ID });
    });

    if (!document.querySelector(`script[src="${ONESIGNAL_SDK}"]`)) {
      const s = document.createElement("script");
      s.src = ONESIGNAL_SDK;
      s.defer = true;
      document.body.appendChild(s);
    }
  }, []);

  return null;
}
