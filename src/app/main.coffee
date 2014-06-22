document.oncontextmenu = (e) ->
  e.preventDefault()

network = new Network()
theGame = new Game(800, 600)