import { Injectable } from '@angular/core';
import { Plugins, PushNotification } from '@capacitor/core';
const { PushNotifications } = Plugins;
import { HttpClient } from '@angular/common/http';

// with type support
import { FCM } from '@capacitor-community/fcm';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from './socket.service';
const fcm = new FCM();
const { Device } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class FcmService {

  notifications: PushNotification[] = [];
  notif = new BehaviorSubject<boolean>(null);
  platform$ = new BehaviorSubject<boolean>(false);
  notifList = new BehaviorSubject<String>(null);
  con$ = new BehaviorSubject<boolean>(false);

  constructor(private socketio: SocketService) {

    this.subscribeTo('panicbutton');
  }

  async checkDevice() {
    const info = await Device.getInfo();
    console.log('INFO', info);
    localStorage.setItem('topic', info.uuid);
    localStorage.setItem('model', info.model);
    localStorage.setItem('manufacturer', info.manufacturer)

    if (info.platform !== "web") {
      this.platform$.next(true)
    }
  }

  connection(data) {
    this.con$.next(data)
  }

  checkNotif() {
    let enable;
    enable = localStorage.getItem("enablenotif");
    console.log(enable)
    if (enable == "true" || enable == undefined || enable == null) {
      this.notif.next(false);
    } else {
      this.notif.next(true);
    }
  }

  registerFcm() {
    let topic = localStorage.getItem('topic');
    PushNotifications.register()
      .then(() => {
        fcm
          .subscribeTo({ topic: topic })
          .then((r) => console.log(topic))
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));

    PushNotifications.addListener('registration', data => {
      console.log(data);
    });

    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotification) => {
        this.notifications.push(notification);
        this.notifList.next(notification.title);
        console.log(this.notifications);
      }
    );

    PushNotifications.createChannel({
      description: 'General Notifications',
      id: 'panicbutton',
      importance: 5,
      lights: true,
      name: 'panicbutton',
      sound: 'ambulance.mp3',
      vibration: true,
      visibility: 1
    }).then((channelResult) => {
      console.log('push channel created: ', channelResult);
    }).catch(error => {
      console.error('push channel error: ', error);
    });

    PushNotifications.createChannel({
      description: 'General Notifications',
      id: 'device',
      importance: 5,
      lights: true,
      name: 'device',
      sound: 'default',
      vibration: true,
      visibility: 1
    }).then((channelResult) => {
      console.log('push channel created: ', channelResult);
    }).catch(error => {
      console.error('push channel error: ', error);
    });
  }

  getFcmToken() {
    return fcm
      .getToken()
      .then(result => {
        console.log('Permission granted! Save to the server!', result.token);
        localStorage.setItem('FCMtoken', result.token)
        let topic = localStorage.getItem('topic');
        this.subscribeTo(topic);
      })
      .catch(err => console.log(err));
  }

  subscribeTo(topic) {
    return PushNotifications.register()
      .then(_ => {
        fcm
          .subscribeTo({ topic: topic })
          .then(r => {
            console.log('Subcribe to ', r)
            // alert('Subcribe to ' + topic)
            // const userPB = {
            //   id: topic,
            //   subscribe:
            //     [topic]
            // }
            // this.socketio.setUserPB(userPB);
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
  }

  unsubcribeTo(topic) {
    fcm
      .unsubscribeFrom({ topic: topic })
      .then(() => alert(`Notification is disabled!`))
      .catch((err) => console.log(err));
  }

  enableNotif() {
    let enable;
    let topic = localStorage.getItem('topic');

    enable = localStorage.getItem("enablenotif");
    if (enable == "true" || enable == undefined || enable == null) {
      localStorage.setItem("enablenotif", "false");
      this.notif.next(true);
      this.unsubcribeTo(topic);
    } else {
      localStorage.setItem("enablenotif", "true");
      this.notif.next(false);
      this.subscribeTo(topic);
    }
  }
}
