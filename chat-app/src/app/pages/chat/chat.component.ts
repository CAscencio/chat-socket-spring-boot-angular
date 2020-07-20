import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Mensaje } from '../../models/mensaje';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styles: []
})
export class ChatComponent implements OnInit {

  private client: Client;
  conectado: boolean = false;
  mensaje: Mensaje = new Mensaje();
  mensajes: Mensaje[] = [];
  escribiendo: string;
  clienteId: string;

  constructor() { 
    this.clienteId = 'id-'+new Date().getUTCMilliseconds() + '-' + Math.random().toString(36).substr(2); 
  }

  ngOnInit() {
    this.client = new Client();
    this.client.webSocketFactory = ()=> {
      return SockJS("http://localhost:8080/chat-websocket");
    }

    this.client.onConnect = (frame)=> {
        console.log('Conectados :' + this.client.connected + ' : ' + frame );
        this.conectado = true;

        //Para enviar mensaje
        this.client.subscribe('/chat/mensaje', event => {
          let mensaje: Mensaje = JSON.parse(event.body) as Mensaje;
          mensaje.fecha = new Date(mensaje.fecha);

          if(!this.mensaje.color && mensaje.tipo == 'NUEVO_USUARIO' && this.mensaje.username == mensaje.username) {
            this.mensaje.color = mensaje.color; 
          }

          this.mensajes.push(mensaje);
          console.log(mensaje);
        });


        //Para saber quien esta escribiendo
        this.client.subscribe('/chat/escribiendo', event => {
          this.escribiendo = event.body;
          setTimeout(() => this.escribiendo = '',2000);
        });

        // Asignacion de ID
        this.client.subscribe('/chat/historial/' + this.clienteId, event => {
          const historial = JSON.parse(event.body) as Mensaje[];
          this.mensajes = historial.map(m => {
            m.fecha = new Date(m.fecha);
            return m;
          }).reverse();
        });

        this.client.publish({destination: '/app/historial', body: this.clienteId});

        this.mensaje.tipo = 'NUEVO_USUARIO';
        this.client.publish({destination: '/app/mensaje', body: JSON.stringify(this.mensaje)});
    }
    this.client.onDisconnect = (frame)=> {
        console.log('Desconectados :' + !this.client.connected + ' : ' + frame );
        this.conectado = false;
        this.mensaje = new Mensaje();
        this.mensajes = [];
    }
  }


  conectar(): void {
    this.client.activate();
  }

  desConectar(): void {
    this.client.deactivate();
  }

  enviarMensaje(): void {
    this.mensaje.tipo = 'MENSAJE';
    this.client.publish({destination: '/app/mensaje', body: JSON.stringify(this.mensaje)});
    this.mensaje.texto = '';
  }

  escribiendoMensaje(): void {
    this.client.publish({destination: '/app/escribiendo', body: this.mensaje.username});
  }

}
