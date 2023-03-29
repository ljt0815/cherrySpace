const socket = io()

socket.on('connect', function() {
    let name = prompt('반갑습니다! 이름을 정하세요', '');

    if(!name) {
        name = '익명';
    }
    
    socket.emit('newUser', name)
})

socket.on('update', function(data) {
    console.log(`${data.name}: ${data.message}`);
})

var send = function () {
    const msg = document.getElementById('test').value;

    document.getElementById('test').value = '';
    
    socket.emit('message', {type: 'message', message: msg});
}