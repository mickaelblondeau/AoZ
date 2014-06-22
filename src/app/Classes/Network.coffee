class Network
  startNetwork: ->
    @socket = io.connect("http://" + window.location.hostname + ":8080")
    @socket.on "setId", (id) ->
      theGame.player.player.playerId = id

    @socket.on "createPlayer", (data) ->
      position = data[1]
      p = new Player(position[0], position[1])
      p.player.playerId = data[0]

    @socket.on "positions", (data) ->
      for p in data
        id = p[0]
        position = p[1]
        unless id is theGame.player.player.playerId
          theGame.players.forEach (item) ->
            if item.playerId is id
              item.x = position[0]
              item.y = position[1]
              if position[2]? and (not item.animations.currentAnim? or item.animations.currentAnim.name isnt position[2])
                item.animations.play position[2]

    @socket.on "createKodo", (data) ->
      position = data[1]
      kodo = new Kodo(position[0], position[1])
      kodo.kodo.entityId = data[0]

    @socket.on "kodosPositions", (data) ->
      for kodo in data
        id = kodo[0]
        position = kodo[1]
        theGame.kodos.forEach (item) ->
          if item.entityId is id
            item.x = position[0]
            item.y = position[1]
            if position[2]? and (not item.animations.currentAnim? or item.animations.currentAnim.name isnt position[2])
              item.animations.play position[2]

    @socket.on "deletePlayer", (id) ->
      theGame.players.forEach (item) ->
        if item and item.playerId is id
          item.destroy()
          return