import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './page/home/home.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSlideUnlockModule } from 'ngx-slide-unlock';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { TimelineModule } from "angular2-timeline";
import { NgxSpinnerModule } from "ngx-spinner";
import { ToggleButtonComponent } from './page/home/toggle-button.component';

const config: SocketIoConfig = { url: 'https://apps.olmatix.com:7000', options: {} };

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ToggleButtonComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule, NgxSlideUnlockModule,
    SocketIoModule.forRoot(config),
    TimelineModule, NgxSpinnerModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
