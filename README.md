# Need A Ride? — South LA

Arcade rideshare game on the real South LA street map. A NORTH STAR · Do Better Network game.

Static site: `index.html` plus the map data files. No build step.

- `map.json` streets, freeways, parks, water, traffic signals (OpenStreetMap)
- `places.json` named places, bus stops, landmark positions
- `buildings.b64.txt` real building footprints and heights (LA County via OpenStreetMap)
- `elev.b64.txt` ground elevation grid

Map data © OpenStreetMap contributors, ODbL.

Engine sound: physically modeled engine synthesis from [engine-sound-generator](https://github.com/Antonio-R1/engine-sound-generator) by Antonio-R1, MIT license.
