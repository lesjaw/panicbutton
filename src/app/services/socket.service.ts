import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { FcmService } from './fcm.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  // paniclog: any = [];

  uuid;

  constructor(private socket: Socket) {
    this.uuid = localStorage.getItem('topic')

  }

  sendMessage(data: any) {
    this.socket.emit('message', data)
  }

  getMessage() {
    return this.socket
      .fromEvent('message-broadcast')
      .pipe(map((data: any) => {
        console.log(data)
      }));
  }

  setPanicData(data: any) {
    this.socket.emit('panic_button_get', data)
  }

  setPanicDataChange(data: any) {
    // console.log(data)
    this.socket.emit('panic_button_change', data)
  }

  delPanicData(data: any) {
    this.socket.emit('panic_button_del', data)
  }

  getPanicData = () => {
    return Observable.create((observer) => {
      this.socket.on('panic_button_get' + this.uuid, (message) => {
        // console.log(message)
        observer.next(message);
      });
    });
  }

  getPanicChange = (id) => {
    return Observable.create((observer) => {
      this.socket.on('panic_button_log' + id, (message) => {
        console.log(message)
        observer.next(message);
      });
    });
  }

  setUserPB(data: any) {
    this.socket.emit('panic_button_user_set', data)
  }

  delUserPB(data: any) {
    this.socket.emit('pb_users_del', data)
  }

  getUserPBData(data: any) {
    this.socket.emit('pb_users_get', data)
  }

  getUserPB = () => {
    return Observable.create((observer) => {
      this.socket.on('pb_users_get' + this.uuid, (message) => {
        // console.log(message)
        observer.next(message);
      });
    });
  }

}
