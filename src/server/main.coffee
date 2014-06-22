io = require('socket.io').listen(8080)
PF = require('pathfinding')
metaGrid = require('../app/assets/meta.json').data
playerFactory = new PlayerFactory()
kodoFactory = new KodoFactory()

io.on 'connection', (socket) ->
  player = playerFactory.createPlayer()
  socket.emit('setId', player.id)
  socket.broadcast.emit('createPlayer', player.getInfo())

  for otherPlayer in playerFactory.players
    if otherPlayer.id != player.id
      socket.emit('createPlayer', otherPlayer.getInfo())

  for kodo in kodoFactory.kodos
    socket.emit('createKodo', kodo.getInfo())

  socket.on 'position', (position) ->
    player.setPosition(position)

  socket.on 'disconnect', ->
    socket.broadcast.emit('deletePlayer', player.id)
    playerFactory.deletePlayer(player)

sendPositions = ->
  io.sockets.emit "kodosPositions", kodoFactory.getPositions()
  io.sockets.emit "positions", playerFactory.getPositions()

setInterval kodoFactory.updatePath, 500
setInterval sendPositions, 1000 / 60

kodoFactory.createKodo 96, 64
kodoFactory.createKodo 64, 96
kodoFactory.createKodo 128, 96
kodoFactory.createKodo 96, 128