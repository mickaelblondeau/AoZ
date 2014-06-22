class Player
  constructor: (x, y) ->
    @player = theGame.players.create(x, y, 'player')
    @player.width = 32
    @player.height = 32
    @player.animations.add(Animations.STAND, [18], 10, true)
    @player.animations.add(Animations.TOP, [0, 1, 2, 3, 4, 5, 6, 7, 8], 10, true)
    @player.animations.add(Animations.LEFT, [9, 10, 11, 12, 13, 14, 15, 16, 17], 10, true)
    @player.animations.add(Animations.BOTTOM, [18, 19, 20, 21, 22, 23, 24, 25, 26], 10, true)
    @player.animations.add(Animations.RIGHT, [27, 28, 29, 30, 31, 32, 33, 34, 35], 10, true)
    @speed = 2

  setTarget: ->
    theGame.player.path = theGame.player.getPathFromPlayer([Math.floor(theGame.cursor.x/32), Math.floor(theGame.cursor.y/32)])
    theGame.player.pathIndex = 1
    theGame.player.target = theGame.player.path[theGame.player.pathIndex]

  move: ->
    move = pathfinding.moveToTarget([@player.x, @player.y], @target, @speed)
    if move
      @player.x = move[1][0]
      @player.y = move[1][1]
      @player.animations.play move[2]
      if move[0] is true
        @pathIndex++
        @target = @path[@pathIndex]

  getPathFromPlayer: (pos) ->
    pathfinding.getSmoothPath([Math.floor(@player.x/32), Math.floor(@player.y/32)], pos, theGame.grid)

  sendPosition: ->
    if network.socket
      network.socket.emit('position', [Math.floor(@player.x), Math.floor(@player.y), @player.animations.currentAnim.name])

  update: ->
    @move()
    @sendPosition()