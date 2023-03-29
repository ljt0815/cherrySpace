const fs = require('fs');
const express = require('express');
const socket = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socket(server);
// const threejs = require('three');

app.use('/js', express.static('./static/js'));
app.use('/css', express.static('./static/css'));
app.use('/images', express.static('./static/images'));
app.use('/models', express.static('./static/models'));



app.get('/', function(req, res) {
    // res.sendFile('./static/index.html')
    fs.readFile('./static/index.html', function(err, data) {
        if(err) {
            res.send('에러');
        } else {
            res.writeHead(200, {'Content-Type':'text/html'});
            res.write(data);
            res.end();
        }
    })
})

io.sockets.on('connection', function(socket) {
    console.log('유저 접속됨');

    socket.on('newUser', function(name) {
        console.log(name + '님이 접속하셨습니다.');
        socket.name = name;
        io.sockets.emit('update', {type: 'connect', name: 'SERVER', message: name + '님이 접속하였습니다.'});
    })

    socket.on('message', function(data) {
        data.name = socket.name;
        console.log(data);
        socket.broadcast.emit('update', data);
    })

    socket.on('disconnect', function() {
        console.log(socket.name + '님이 나가셨습니다.');
        socket.broadcast.emit('update', {type: 'disconnect', name: 'SERVER', message: socket.name + '님이 나가셨습니다.'}); 
    })
})

server.listen(5000, () => {
    console.log('서버 실행중');
})