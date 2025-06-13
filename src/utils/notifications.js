import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { projectId } from "../firebase/firebase.config" 

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export async function registerForPushNotificationsAsync() {
  let token

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!")
      return
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })
    ).data
  } else {
    alert("Must use physical device for Push Notifications")
  }

  return token
}

export function schedulePushNotification(title, body, data = {}) {
  Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      data: data,
    },
    trigger: { seconds: 2 },
  })
}