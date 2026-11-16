const BASE = "https://pokeapi.co/api/v2/pokemon/"
const randomInt = max => Math.floor(Math.random() * max) + 1

async function loadPokemon(id) {
  const data = await new Request(BASE + id).loadJSON()
  return {
    id: data.id,
    name: data.name[0].toUpperCase() + data.name.slice(1),
    types: data.types.map(t => t.type.name).join(", "),
    imgUrl:
      data.sprites.other["official-artwork"].front_default ||
      data.sprites.front_default
  }
}

// Widget with name + type only, no image
function buildHiddenWidget(p) {
  const w = new ListWidget()
  w.setPadding(16, 16, 16, 16)
  w.backgroundColor = new Color("#111111")

  const name = w.addText(p.name)
  name.textColor = Color.white()
  name.font = Font.boldSystemFont(20)
  name.centerAlignText()

  w.addSpacer(4)

  const type = w.addText(p.types)
  type.textColor = Color.gray()
  type.font = Font.systemFont(13)
  type.centerAlignText()

  w.addSpacer(12)

  const hint = w.addText("👆 Tap to reveal")
  hint.textColor = new Color("#F2C94C")
  hint.font = Font.semiboldSystemFont(12)
  hint.centerAlignText()

  // Tapping reruns this script with the pokemon id
  w.url = `${URLScheme.forRunningScript()}?id=${p.id}`
  return w
}

// Widget with the image revealed
async function buildRevealedWidget(p) {
  const img = await new Request(p.imgUrl).loadImage()
  const w = new ListWidget()
  w.setPadding(16, 16, 16, 16)
  w.backgroundColor = new Color("#111111")

  const image = w.addImage(img)
  image.imageSize = new Size(180, 180)
  image.centerAlignImage()

  w.addSpacer(8)

  const name = w.addText(p.name)
  name.textColor = Color.white()
  name.font = Font.boldSystemFont(20)
  name.centerAlignText()

  const type = w.addText(p.types)
  type.textColor = Color.gray()
  type.font = Font.systemFont(13)
  type.centerAlignText()
  return w
}

// 1) Tapped from the widget: reveal the image
if (args.queryParameters && args.queryParameters.id) {
  const p = await loadPokemon(args.queryParameters.id)
  await (await buildRevealedWidget(p)).presentLarge()
  Script.complete()
  return
}

// 2) Running on the home screen: name + type only
if (config.runsInWidget) {
  const p = await loadPokemon(randomInt(1025))
  Script.setWidget(buildHiddenWidget(p))
  Script.complete()
  return
}

// 3) Running in the app: prompt, show name + type, Reveal button
let alert = new Alert()
alert.title = "Random Pokemon"
alert.message = "What's the max number of pokemon we're working with?"
alert.addTextField("Max number (1-1025)", "")
alert.addAction("OK")
alert.addCancelAction("Cancel")

if ((await alert.present()) === -1) {
  Script.complete()
  return
}

const input = Number(alert.textFieldValue(0))
if (!Number.isInteger(input) || input < 1 || input > 1025) {
  let err = new Alert()
  err.title = "Whoops"
  err.message = "Please enter a number between 1 and 1025 🫠"
  err.addAction("OK")
  await err.present()
  Script.complete()
  return
}

const p = await loadPokemon(randomInt(input))

let reveal = new Alert()
reveal.title = p.name
reveal.message = `Type: ${p.types}`
reveal.addAction("Reveal image")
reveal.addCancelAction("Not yet")

if ((await reveal.present()) === 0) {
  await (await buildRevealedWidget(p)).presentLarge()
}
Script.complete()
