const fs = require('fs');
const express = require('express');
const socket = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socket(server);

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

function getPlayerColor(){
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

class Player{
    constructor(socket){
        this.socket = socket;
        this.scale = 4.5;
        this.x = (Math.random() * 10) - 5;
        this.y = 2.25;
        this.z = -70;
        this.color = getPlayerColor();
    }

    get id() {
        return this.socket.id;
    }
}

const players = [];
const playerMap = {};

function joinGame(socket){
    let player = new Player(socket);

    players.push(player);
    playerMap[socket.id] = player;

    return player;
}

function endGame(socket){
    for( var i = 0 ; i < players.length; i++){
        if(players[i].id == socket.id){
            players.splice(i,1);
            break
        }
    }
    delete playerMap[socket.id];
}

io.sockets.on('connection', function(socket) {
    console.log(`${socket.id}` + '님이 접속하셨습니다.');

    socket.on('disconnect', function() {
        console.log(`${socket.id}` + '님이 나가셨습니다.');
        endGame(socket);
        socket.broadcast.emit('leave_user', socket.id); 
    });

    let newPlayer = joinGame(socket);
    socket.emit('init', {
        x: newPlayer.x,
        z: newPlayer.z
    });
    for (let i = 0; i < players.length; i++) {
        let player = players[i];
        if (player.id === socket.id) continue ;
        socket.emit('join_user', {
            id: player.id,
            x: player.x,
            y: player.y,
            z: player.z,
            scale: player.scale
        });
    }
    socket.broadcast.emit('join_user', {
        id: socket.id,
        x: newPlayer.x,
        y: newPlayer.y,
        z: newPlayer.z,
        scale: newPlayer.scale
    });

    socket.on('send_location', function(data) {
        socket.broadcast.emit('update_state', {
            id: data.id,
            x: data.x,
            z: data.z
        })
    })
})

server.listen(5000, () => {
    console.log('서버 실행중');
})