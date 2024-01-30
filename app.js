const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'cricketMatchDetails.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error:${error.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertPlayerDetails = dbObject => {
  return {
    playerId = dbObject.player_id,
    playerName = dbObject.playerName,
  }
}

const convertMatchDetails = dbObject => {
  return {
    matchId = dbObject.match_id,
    match = dbObject.match,
    year = dbObject.year,
  }
}

const convertPlayerMatchScore = dbObject => {
  return {
    playerMatchId = dbObject.player_match_id,
    playerId = dbObject.player_id,
    matchId = dbObject.match_id,
    score = dbObject.score,
    fours = dbObject.fours,
    sixes = dbObject.sixes,
  }
}

app.get('/players/', async (_request, response) => {
  const getPlayersQuery = `
  SELECT
  *
  FROM
  player_details;
  `
  const playersArray = await database.all(getPlayersQuery)
  response.send(
    playersArray.map(eachPlayer => convertPlayerDetails(eachPlayer)),
  )
})

app.get('/players/:playerId/', (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
  SELECT
  *
  FROM
  player_details
  WHERE
  player_id="${playerId}"
  `
  const player = await database.get(getPlayerQuery)
  response.send(convertPlayerDetails(player))
})

app.put('/players/:playerId', (request, response) => {
  const {playerName} = request.body
  const {playerId} = request.params
  const updatePlayerQuery = `
  UPDATE
  player_details
  SET
  player_name="${playerName}"
  WHERE
  player_id=${playerId}`
  await database.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', (request, response) => {
  const {matchId} = request.params
  const getMatchDetails = `
  SELECT*FROM
  match_details
  WHERE
  match_id="${matchId}"`
  const match = await database.get(getMatchDetails)
  response.send(convertMatchDetails(match))
})

app.get('/players/:playerId/matches', (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQuery = `
  SELECT
  *
  FROM player_match_score
  NATURAL JOIN match_details
  WHERE
  player_id=${playerId};
  `

  const playerMatches = await database.all(getPlayerMatchesQuery)
  response.send(
    playerMatches.map(eachMatch => convertPlayerMatchScore(eachMatch)),
  )
})

app.get('/matches/:matchId/players', (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `
  SELECT
  player_details.player_id AS playerId,
  player_details.player_name AS playerName
  FROM player_match_score NATURAL JOIN player_details
  WHERE match_id=${matchId};
  `
  const matchDetails = await database.all(getMatchPlayersQuery)
  response.send(
    matchDetails.map(eachMatch => convertPlayerMatchScore(eachMatch)),
  )
})

app.get('/players/:playerId/playerScores', (request, response) => {
  const {playerId} = request.params
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `
  const players = await database.all(getPlayerScored)
  response.send(
    playerId : players["playerId"],
    playerName:players["playerName"],
    totalScore:players["totalScore"],
    totalFours:players["totalFours"],
    totalSixes:players["totalSixes"]

  
  )
})
