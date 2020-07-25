docker rm -f serverless-messenger-ddb
docker run --rm --name serverless-messenger-ddb -p 8000:8000 amazon/dynamodb-local &
sleep 1
aws dynamodb create-table  --endpoint-url http://localhost:8000  --table-name TEST_TABLE  --attribute-definitions AttributeName=HK,AttributeType=S AttributeName=SK,AttributeType=S  --key-schema AttributeName=HK,KeyType=HASH AttributeName=SK,KeyType=RANGE --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1