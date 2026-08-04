const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const api = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WS_ENDPOINT
});
const scheduler = new AWS.Scheduler();

exports.handler = async () => {
  const tracks = await db.scan({ TableName: "Tracks" }).promise();
  const available = tracks.Items.filter(t => !t.disabledUntil || t.disabledUntil < Date.now());

  const selected = available.sort(() => 0.5 - Math.random()).slice(0, 3);
  const sessionId = Date.now().toString();

  await db.put({
    TableName: "Sessions",
    Item: {
      sessionId,
      tracks: selected.map(t => t.trackName),
      votes: {}
    }
  }).promise();

  const connections = await db.scan({ TableName: "Connections" }).promise();

  const newSessionPayload = {
    type: "newSession",
    sessionId,
    tracks: selected.map(t => t.trackName)
  };

  const countdownPayload = {
    type: "countdownStart",
    duration: 10,
    sessionId
  };

  for (const c of connections.Items) {
    await api.postToConnection({
      ConnectionId: c.connectionId,
      Data: JSON.stringify(newSessionPayload)
    }).promise().catch(() => {});

    await api.postToConnection({
      ConnectionId: c.connectionId,
      Data: JSON.stringify(countdownPayload)
    }).promise().catch(() => {});
  }

  await scheduler.createSchedule({
    Name: `endSession-${sessionId}`,
    ScheduleExpression: "at(" + new Date(Date.now() + 10000).toISOString() + ")",
    FlexibleTimeWindow: { Mode: "OFF" },
    Target: {
      Arn: process.env.END_SESSION_ARN,
      RoleArn: process.env.SCHEDULER_ROLE_ARN,
      Input: JSON.stringify({ sessionId })
    }
  }).promise();

  return { statusCode: 200 };
};
