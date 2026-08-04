const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const role = event.queryStringParameters?.role || "user";

  await db.put({
    TableName: "Connections",
    Item: { connectionId, role }
  }).promise();

  return { statusCode: 200 };
};
