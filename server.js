'use strict';

// node modules
const net = require('net');
const EE = require('events');

// app modules
const Client = require('./model/client.js');

//env vars
const PORT = process.env.PORT || 3000;

//module constants
const clientPool = [];
const server = net.createServer();
const ee = new EE();

ee.on('\/nick', (client, string) => {
  for (let i = 0; i < clientPool.length; i++) {
    if(string.trim() === clientPool[i]) {
      client.socket.write(`${string} already exists.
        Please choose a different nickname\n`);
      return;
    }
    clientPool[i].socket.write(`${client.nickname} has changed their nickname to ${string}\n`);
  }
  client.nickname = string.trim();
});

ee.on('\/all', (client, string) => {
  clientPool.forEach( c => {
    c.socket.write(`${client.nickname}: ${string}`);
  });
});

ee.on('\/help', client => {
  client.socket.write('User Chat Commands:\n');
  client.socket.write(`
    /all [message] <--sends chat to room\n
    /nick [nickname] <--changes your current nickname\n
    /room <-- displays all current room participants\n
    /dm [username] <--sends direct message to only specified user\n`);
});

ee.on('\/dm', (client, string) => {
  for (let i =0; i <clientPool.length; i++) {
    if (string.split(' ')[0] === clientPool[i].nickname) {
      client.socket.write(`${client.nickname}(DM to ${clientPool[i].nickname}): ${string.split} ${string.split(' ').slice(1).join(' ')}`);
      return;
    }
  }
  client.socket.write(`Sorry, ${client.nickname}, that is not a valid user to DM.`);
});

ee.on('default', client => {
  client.socket.write('Invalid Input. Type /help for a list of valid ones');
});

server.on('connection', socket => {
  let client = new Client(socket);
  clientPool.push(client);
  for (let i = 0; i < clientPool.length; i++) {
    clientPool[i].socket.write(`${client.nickname} has joined the chat!\n`);
  }
  socket.on('data', data => {
    const command = data.toString().split(' ').shift().trim();

    if (command.startsWith('\/')) {
      ee.emit(command, client, data.toString().split(' ').slice(1).join(' '));
      return;
    }
    ee.emit('default', client, data.toString());
  });
  socket.on('error', err => {
    console.error(err);
  });

  socket.on('close,', () => {
    for( let i = 0; i < clientPool.length; i++) {
      clientPool[i].socket.write(`${client.nickname} has exited the chat\n`);
    }
  });
});

server.listen(PORT, () => {
  console.log('server running on port', PORT);
});
