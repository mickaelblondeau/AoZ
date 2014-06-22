class PlayerFactory
  constructor: ->
    @id = 1
    @players = []

  createPlayer: () ->
    player = new Player(@id)
    @players.push player
    @id++
    return player

  deletePlayer: (p) ->
    for player, i in @players
      if player.id == p.id
        @players.splice(i, 1)
        break

  getPositions: ->
    arr = []
    for player in @players
      arr.push player.getInfo()
    return arr