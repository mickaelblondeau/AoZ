class KodoFactory
  constructor: ->
    @id = 1
    @kodos = []

  createKodo: (x, y) ->
    kodo = new Kodo(x, y, @id)
    @kodos.push kodo
    io.sockets.emit "createKodo", kodo.getInfo()
    @id++

  updatePath: ->
    if playerFactory.players.length > 0
      for kodo in kodoFactory.kodos
        player = kodoFactory.getNearestPlayer(kodo)
        kodo.path = pathfinding.getSmoothPath([
          Math.floor(kodo.x / 32)
          Math.floor(kodo.y / 32)
        ], [
          Math.floor(player.x / 32)
          Math.floor(player.y / 32)
        ], metaGrid)
        kodo.pathIndex = 1

  getPositions: ->
    arr = []
    for kodo in @kodos
      @moveKodo(kodo)
      arr.push kodo.getInfo()
    return arr

  moveKodo: (kodo) ->
    if kodo.path
      move = pathfinding.moveToTarget([
        kodo.x
        kodo.y
      ], kodo.path[kodo.pathIndex], kodo.speed)
      if move
        kodo.x = move[1][0]
        kodo.y = move[1][1]
        kodo.animation = move[2]
        if move[0] is true
          kodo.pathIndex++

  getNearestPlayer: (kodo) ->
    nearest = undefined
    for player in playerFactory.players
      unless nearest
        nearest = player
      else
        dist1 = @getDistance([
          nearest.x
          nearest.y
        ], [
          kodo.x
          kodo.y
        ])
        dist2 = @getDistance([
          player.x
          player.y
        ], [
          kodo.x
          kodo.y
        ])
        if dist2 < dist1
          nearest = player
    nearest

  getDistance: (a, b) ->
    vector = [
      b[0] - a[0]
      b[1] - a[1]
    ]
    Math.pow(vector[0], 2) + Math.pow(vector[1], 2)