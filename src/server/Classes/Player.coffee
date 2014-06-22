class Player
  constructor: (id) ->
    @id = id
    @x = 0
    @y = 0
    @animation = 0

  getInfo: ->
    return [
      @id
      [
        Math.floor(@x)
        Math.floor(@y)
        @animation
      ]
    ]

  setPosition: (position) ->
    @x = position[0]
    @y = position[1]
    @animation = position[2]