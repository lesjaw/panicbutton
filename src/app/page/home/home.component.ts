import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, HostListener, NgZone } from '@angular/core';
import { FcmService } from 'src/app/services/fcm.service';
import { Paho } from 'ng2-mqtt/mqttws31';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SocketService } from 'src/app/services/socket.service';
import { trigger, state, style, transition, animate, query, stagger, keyframes } from '@angular/animations';
import * as AOS from 'aos'
import { Plugins } from '@capacitor/core';
const { App } = Plugins;
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('simpleFadeAnimation', [
      state('initial', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      state('final', style({
        opacity: 0,
        transform: 'translateY(-100%)'
      })),
      transition('initial<=>final', animate('1000ms ease-in')),
    ]),
    trigger('logpanicAwal', [
      state('initial', style({
        opacity: 1,
        'margin-top': '-20px'
      })),
      state('final', style({
        opacity: 1,
        'margin-top': '20px'
      })),
      transition('initial<=>final', animate('1000ms ease-in')),
    ]),

    trigger('simpleFadeAnimationTopBot', [
      state('initial', style({
        opacity: 1,
        'margin-top': '{{ margintop }}'
      }), { params: { margintop: 0 } }),
      state('final', style({
        opacity: 1,
        'margin-top': '{{ margintop }}'
      }), { params: { margintop: 0 } }),
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
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {

  title = 'Panic Button';
  uuid;
  notif: any = [];
  notiflist;
  id = 0;
  time = new Date();
  // mqttbroker = 'broker.emqx.io';
  mqttbroker = 'cloud.olmatix.com';
  private client;
  currentState = "show";
  private onApps = false;
  public message: string;
  closeResult = '';
  ids;
  subsId;
  margint = 0;
  getSubs = "";
  userFilter;
  value = 0;
  sendOnce = false;
  @ViewChild("eluuid") eluuid: ElementRef;
  margincardlog = "-20px";
  marginlog = "initial";
  margincard: string;
  margintTemp: any;
  mylocation;
  checked: boolean = false;

  constructor(private fcm: FcmService, private modalService: NgbModal, private socketio: SocketService,
    private spinner: NgxSpinnerService, private router: Router) {
    this.spinner.show();

    setTimeout(() => {
      /** spinner ends after 5 seconds */
      this.spinner.hide();
    }, 5000);

    this.fcm.checkDevice();

    App.addListener("backButton", (data: any) => {
      console.log('App opened with URL: ' + data.url);
      App.exitApp();
    });

    AOS.init();

    setInterval(() => {
      this.time = new Date();
    }, 1000);

    this.fcm.platform$.subscribe(data => {
      console.log(data)
      if (data) {
        console.log('Capacitor registerFCM')
        this.fcm.registerFcm();
        this.fcm.getFcmToken();
        this.uuid = localStorage.getItem('topic');
        this.onApps = true;
      } else {
        this.uuid = localStorage.getItem('topic');
      }
      if (this.uuid == undefined || this.uuid == null) {
        this.router.navigate(['/']).then();
      }
    });

    console.log(this.uuid)
    if (this.uuid) {
      this.mqttConect();
    }

    const userFilter1 = {
      id: this.uuid
    }
    this.socketio.getUserPBData(userFilter1);

    const userPB = {
      id: this.uuid,
      subscribe: [
        this.uuid
      ]
    }
    this.socketio.setUserPB(userPB);

    this.socketio.getPanicData().subscribe((message: any) => {
      this.spinner.hide();
      console.log(message);
      if (message) {
        this.notif = message.result
      } else {
        this.notif = [];
      }
    });

    this.socketio.getUserPB().subscribe((message: any) => {
      console.log(message.result[0].subscribe);
      this.subsId = message.result[0].subscribe;
      if (message.result[0].subscribe) {
        for (var index in this.subsId) {
          // console.log(this.subsId[index].toString());
          this.getSubs = this.getSubs + this.subsId[index].toString() + "|";
          this.socketio.getPanicChange(this.subsId[index].toString()).subscribe((message: any) => {
            if (this.notif == undefined) this.notif = [];
            this.notif.push(message.new);
            // console.log(this.notif)
          });
        }
        // console.log(this.getSubs)
        this.userFilter = {
          get: this.getSubs + "test",
          user: this.uuid
        }
        this.socketio.setPanicData(this.userFilter);
      }
    });
    const latlon = JSON.parse(localStorage.getItem('kordinat'));
    this.mylocation = latlon.lat + "," + latlon.lon
    console.log(this.mylocation)

    this.notiflist = this.fcm.notifications;
  }

  ngAfterViewInit(): void {

    setTimeout(() => {
      const ele = this.eluuid.nativeElement.getBoundingClientRect();
      console.log(ele)
      this.margint = ele.y
      this.margintTemp = ele.y
    });
  }

  ngOnInit(): void {
  }

  async openApp(data: any) {
    let ret = await App.openUrl({ url: 'com.google.android.apps.maps' });
    console.log('Can open url: ', ret);
  }

  mqttConect() {
    console.log('MqttConnect', this.uuid)
    this.client = new Paho.MQTT.Client(this.mqttbroker, 8084, this.uuid);
    this.client.onMessageArrived = this.onMessageArrived.bind(this);
    this.client.onConnectionLost = this.onConnectionLost.bind(this);
    this.client.connect({ onSuccess: this.onConnect.bind(this) });
  }

  onConnect() {
    console.log('Mqtt onConnect', this.uuid);
    this.client.subscribe('/test/status/' + this.uuid);
    this.client.subscribe('/test/online');
  }

  sendMessage() {
    this.socketio.sendMessage("Home on Open")

  }

  onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log('onConnectionLost:' + responseObject.errorMessage);
      this.mqttConect()
    }
  }

  onMessageArrived(message) {
    console.log('onMessageArrived: ' + message.destinationName + ': ' + message.payloadString);
    const data = message.payloadString.split(';');
    this.sendOnce = false;
    setTimeout(() => {
      this.runValue(100);
    }, 0);

    if (message.destinationName == "/test/online") {
      // console.log('onMessageArrived: ' + message.destinationName + ': ' + message.payloadString);
      if (message.payloadString == "true") {
        // alert('Server Online');
        this.fcm.connection(true);
      } else {
        alert('Houston we got problem, Contact Lesjaw ASAP!')
        this.fcm.connection(false);
      }

    }
  }

  unsafePublish(): void {
    const kordinat: any = JSON.parse(localStorage.getItem('kordinat'));
    let model = localStorage.getItem('model');
    let packet = new Paho.MQTT.Message(this.uuid + ';' + model + ";" + kordinat.lat + ',' + kordinat.lon);
    packet.destinationName = "/test/status";
    this.client.send(packet);
    this.socketio.setPanicDataChange(this.userFilter);
    console.log(packet)

  }

  ngOnDestroy(): void {
    this.client.unsubcribe('/test/status');
    this.client.unsubcribe('/test/online');
  }

  open(content) {
    const userFilter1 = {
      id: this.uuid
    }
    this.socketio.getUserPBData(userFilter1);

    this.modalService.open(content, { windowClass: 'modal-holder', ariaLabelledBy: 'modal-basic-title', size: 'sm', centered: true }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
    // console.log(this.closeResult)
  }

  private getDismissReason(reason: any): string {
    console.log(reason);
    if (reason == "Save click") {
      if (this.ids !== undefined) {
        console.log(this.ids)
        const userPB = {
          id: this.uuid,
          subscribe:
            [this.ids]
        }
        this.socketio.setUserPB(userPB);
        if (this.onApps) {
          this.fcm.subscribeTo(this.ids);
        }
        this.socketio.getPanicChange(this.ids).subscribe((message: any) => {
          console.log(message);
          this.notif.push(message.new);
        });
      }
    }

    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  deleteID(id) {
    console.log(id)
    if (id !== undefined && id != this.uuid) {
      console.log(this.ids)
      const userPB = {
        id: this.uuid,
        sub: id
      }
      this.socketio.delUserPB(userPB);
      if (this.onApps) {
        this.fcm.unsubcribeTo(id);
      }

      this.modalService.dismissAll();

    } else {
      alert("Sorry can not delete your own App ID")
    }
  }

  clear() {
    if (confirm("Are you sure to delete/clear panic log?")) {
      const userFilter = {
        user: this.uuid
      }
      this.socketio.delPanicData(userFilter);
      this.socketio.setPanicData(this.userFilter);
    }
  }

  trackByDate(data: any): string {
    console.log('trackBy', data)
    return data.id;
  }


  @HostListener('window:scroll', ['$event'])
  onScrollEvent($event) {
    // console.log($event);
    const verticalOffset = window.pageYOffset
      || document.documentElement.scrollTop
      || document.body.scrollTop || 0;
    // console.log(verticalOffset);

    // console.log(verticalOffset);

    if (verticalOffset > 65) {
      this.currentState = 'final'
      // this.margincardlog = "10px"
      this.marginlog = "final"
      this.margincard = "final"
      // this.margint = 100
      // this.margint = 60


    } else if (verticalOffset < 190) {
      this.currentState = 'initial'
      this.margincardlog = "-20px"
      this.marginlog = "initial"
      this.margincard = "initial"
      // this.margint = this.margintTemp
      // this.margint = this.margintTemp

      // [@simpleFadeAnimationTopBot]="margincard"
    }
    // console.log(this.margincard, this.margint)

  }

  valueChanged(e) {

    let f = e;
    if (e >= 100) {
      if (this.sendOnce == false) {
        this.sendOnce = true
        this.unsafePublish();
      }
    } else if (e < 100) {
      // console.log(f)
      setTimeout(() => {
        this.runValue(e);
      }, 0);
    }
  }

  slide(e) {
    console.log(e);
    if (e == true) {
      if (this.sendOnce == false) {
        this.sendOnce = true
        this.unsafePublish();
      }
    }
  }

  butToggle(e) {
    console.log(e, this.checked)
    if (e) {
      this.unsafePublish();
      this.checked = false

    } else {
      this.checked = true
    }
  }

  runValue(e) {
    // console.log(e)
    this.value = e
    for (let i = 0; i < e; i++) {
      this.value = this.value - 1;
    }
    //console.log(this.value)
  }

}