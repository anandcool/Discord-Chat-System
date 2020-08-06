const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage  =require('./utils/messages')
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app)
const io = socketio(server);
const botName = 'ChatCord'

//Set Static folder
app.use(express.static(path.join(__dirname,'public')));

// Run when client connects
io.on("connection",socket =>{

    socket.on('joinRoom',({username,room})=>{
        const user = userJoin(socket.id,username,room)
        socket.join(user.room);


        socket.emit('message',formatMessage(botName,'Welcome to Chat Cord!!!'))

        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message',formatMessage(botName,`${user.username} has joined to chat`))

        // Send users and room info
        // console.log(getRoomUsers(user.room))
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        })

    }) 

        //Listen chat message 
        socket.on('chatMessage',msg =>{
            const user = getCurrentUser(socket.id);
            // console.log(user)
            io.to(user.room).emit('message',formatMessage(user.username,msg))
         })


    //Runs when clients disconnect
    socket.on('disconnect',()=>{
        const user = userLeave(socket.id)
        if(user){
            io.to(user.room).emit('message',formatMessage(user.username,`${user.username} has left chat`))
              // Send users and room info
            io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
            })

        }

        
    })


})

const PORT = process.env.PORT || 3000;

server.listen(PORT,()=>console.log(`Server is running at ${PORT}`))