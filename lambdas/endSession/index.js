const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const api = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WS_ENDPOINT
});

exports.handler = async (event) => {
  const sessionId = event.sessionId;

  const session = await db.get({
    TableName: "Sessions",
    Key: { sessionId }
  }).promise();

  const votes = session.Item.votes;
  const tracks = session.Item.tracks;

  let winner = null;
  let maxVotes = -1;

  tracks.forEach(track => {
    const count = votes[track] || 0;
    if (count > maxVotes) {
      winner = track;
      maxVotes = count;
    }
  });

  const topTracks = tracks.filter(t => (votes[t] || 0) === maxVotes);
  if (topTracks.length > 1) {
    winner = topTracks[Math.floor(Math.random() * topTracks.length)];
  }

  await db.update({
    TableName: "Tracks",
    Key: { trackName: winner },
    UpdateExpression: "SET disabledUntil = :ts",
    ExpressionAttributeValues: {
      ":ts": Date.now() + 10 * 60 * 1000
    }
  }).promise();

  const connections = await db.scan({ TableName: "Connections" }).promise();

  const payload = {
    type: "sessionEnded",
    sessionId,
    winner
  };

  for (const c of connections.Items) {
    await api.postToConnection({
      ConnectionId: c.connectionId,
      Data: JSON.stringify(payload)
    }).promise().catch(() => {});
  }

  return { statusCode: 200 };
};
