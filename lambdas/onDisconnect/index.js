const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  await db.delete({
    TableName: "Connections",
    Key: { connectionId }
  }).promise();

  return { statusCode: 200 };
};
