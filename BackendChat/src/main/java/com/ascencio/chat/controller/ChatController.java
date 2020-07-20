package com.ascencio.chat.controller;

import com.ascencio.chat.model.Mensaje;
import com.ascencio.chat.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.Date;
import java.util.Random;

@Controller
public class ChatController {

    private String[] colores = {"red","green","blue","magenta","purple","orange"};

    @Autowired
    private SimpMessagingTemplate websocket;

    @Autowired
    private ChatService chatService;

    @MessageMapping("/mensaje") //Recibir mensaje
    @SendTo("/chat/mensaje") //Para notificar a los demas clientes y enviar mensaje
    public Mensaje recibeMensaje(Mensaje mensaje) {
        mensaje.setFecha(new Date().getTime());
        if(mensaje.getTipo().equals("NUEVO_USUARIO")) {
            mensaje.setColor(colores[new Random().nextInt(colores.length)]);
            mensaje.setTexto("Nuevo usuario");
        }else {
            chatService.guardar(mensaje);
        }
//        mensaje.setTexto("Recibido por el broker: "+ mensaje.getTexto());
        return mensaje;
    }

    @MessageMapping("/escribiendo")
    @SendTo("/chat/escribiendo")
    public String estaEscribiendo(String username) {
        return username.concat(" esta escribiendo...");
    }

    @MessageMapping("/historial")
    public void historial(String clientId) {
        websocket.convertAndSend("/chat/historial/" + clientId,chatService.obtenerUltimos10Mensajes());
    }
}
