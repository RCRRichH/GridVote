const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const track = body.track;

  const session = await db.get({
    TableName: "Sessions",
    Key: { sessionId: body.sessionId }
  }).promise();

  session.Item.votes[track] = (session.Item.votes[track] || 0) + 1;

  await db.put({
    TableName: "Sessions",
    Item: session.Item
  }).promise();

  return { statusCode: 200 };
};
