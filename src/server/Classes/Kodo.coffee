class Kodo
  constructor: (x, y, id) ->
    @id = id
    @x = x
    @y = y
    @animation = 0
    @speed = 1

  getInfo: ->
    return [
      @id
      [
        Math.floor(@x)
        Math.floor(@y)
        @animation
      ]
    ]