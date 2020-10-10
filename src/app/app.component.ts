import { Component } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { FcmService } from './services/fcm.service';
import { trigger, state, style, transition, animate, query, stagger, keyframes } from '@angular/animations';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
const { App } = Plugins;
const { Geolocation } = Plugins;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('simpleFadeAnimation', [
      state('show', style({
        opacity: 1,
        transform: 'translateX(0)'
      })),
      state('hide', style({
        opacity: 0,
        transform: 'translateX(100%)'

      })),
      transition('initial<=>final', animate('1000ms ease-in')),
    ]),
    trigger('listAnimation', [
      transition('* => *', [

        query(':enter', style({ opacity: 0 }), { optional: true }),

        query(':enter', stagger('500ms', [
          animate('1s ease-in', keyframes([
            style({ opacity: 0, transform: 'translateY(-75%)', offset: 0 }),
            style({ opacity: .5, transform: 'translateY(35px)', offset: 0.3 }),
            style({ opacity: 1, transform: 'translateY(0)', offset: 1.0 }),
          ]))]), { optional: true }),
        query(':leave', stagger('100ms', [
          animate('500ms ease-in', keyframes([
            style({ opacity: 1, transform: 'translateY(0)', offset: 0 }),
            style({ opacity: .5, transform: 'translateY(35px)', offset: 0.3 }),
            style({ opacity: 0, transform: 'translateY(-75%)', offset: 1.0 }),
          ]))]), { optional: true })
      ])
    ]),
    trigger('fading', [
      transition('void => *', [
        style({ opacity: 0 }),
        animate(1000)]),
      transition('* => void', [
        style({ opacity: 1 }),
        animate(1000, style({ opacity: 0 }))])
    ])
  ]
})
export class AppComponent {
  title = 'Panic Button';
  connected = false;
  positionWatchId;
  position;

  constructor(private fcm: FcmService, private modalService: NgbModal) {

    this.fcm.checkDevice();

    this.fcm.con$.subscribe((data: any) => {
      if (data) {
        this.connected = true
      } else {
        this.connected = false
      }
    })

    this.getCurrentPosition();
  }

  async appExit() {
    await App.exitApp();
  }

  open(content) {

    this.modalService.open(content, { windowClass: 'modal-holder', ariaLabelledBy: 'modal-basic-title', size: 'sm', centered: true }).result.then((result) => {
    }, (reason) => {
    });
    // console.log(this.closeResult)
  }

  getCurrentPosition() {

    if (this.positionWatchId) {
      Geolocation.clearWatch({ id: this.positionWatchId });
      this.positionWatchId = null;
    }

    this.positionWatchId = Geolocation.watchPosition({ timeout: 30000, enableHighAccuracy: true }, result => {
      this.position = result;

      const cord = {
        lat: result.coords.latitude,
        lon: result.coords.longitude,
        timestamp: result.timestamp
      }

      console.log(this.position);
      localStorage.setItem("kordinat", JSON.stringify(cord));
      Geolocation.clearWatch({ id: this.positionWatchId });
      this.positionWatchId = null;
    });
  }

}
