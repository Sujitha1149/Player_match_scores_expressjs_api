const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initializeDbandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbandServer();

//api 1
const getPlayerDetails = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const playerQuery = `
    select * from player_details;
    `;
  const op = await db.all(playerQuery);
  response.send(op.map((eachPlayer) => getPlayerDetails(eachPlayer)));
});
//api 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
    select * from player_details
    where player_id=${playerId};
    `;
  const op = await db.get(playerQuery);
  response.send(getPlayerDetails(op));
});
//api 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updateQuery = `
    update player_details
    set 
    player_name="${playerName}"
    where player_id=${playerId};
    `;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});

//api 4
const getMatchDetailss = (match) => {
  return {
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
  select * from match_details
  where match_id=${matchId};
  `;
  const playersArray = await db.get(getPlayersQuery);
  response.send(getMatchDetailss(playersArray));
});

//api 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
  select * from match_details natural join player_match_score
  where player_id=${playerId};
  `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray.map((eachItem) => getMatchDetailss(eachItem)));
});
//api 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
  select * from player_details natural join player_match_score
  where match_id=${matchId};
  `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray.map((eachItem) => getPlayerDetails(eachItem)));
});
//api 7
const playerStatsObject = (playerName, statsObj) => {
  return {
    playerId: statsObj.player_id,
    playerName: playerName,
    totalScore: statsObj.totalScore,
    totalFours: statsObj.totalFours,
    totalSixes: statsObj.totalSixes,
  };
};
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
    SELECT player_name
        FROM player_details
    WHERE player_id=${playerId};`;
  const getPlayerNameResponse = await db.get(getPlayerNameQuery);
  const getPlayerStatisticsQuery = `
    SELECT 
        player_id,
        sum(score) AS totalScore,
        sum(fours) AS totalFours,
        sum(sixes) AS totalSixes
    FROM 
        player_match_score
    WHERE 
        player_id=${playerId};`;

  const getPlayerStatisticsResponse = await db.get(getPlayerStatisticsQuery);
  response.send(
    playerStatsObject(
      getPlayerNameResponse.player_name,
      getPlayerStatisticsResponse
    )
  );
});
module.exports = app;
