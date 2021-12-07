#!/bin/bash
CHAINCODE_NAME=${1:-"basic"}
ORG=${2:-"org1"}
CHAINCODE_SERVER_PORT=${3:-"7052"}
ADDRESS="${CHAINCODE_NAME}-${ORG}:${CHAINCODE_SERVER_PORT}"

echo "{
    \"address\": \"${ADDRESS}\",
    \"dial_timeout\": \"10s\",
    \"tls_required\": false,
    \"client_auth_required\": false,
    \"client_key\": \"-----BEGIN EC PRIVATE KEY----- ... -----END EC PRIVATE KEY-----\",
    \"client_cert\": \"-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----\",
    \"root_cert\": \"-----BEGIN CERTIFICATE---- ... -----END CERTIFICATE-----\"
}" > connection.json

tar cfz code.tar.gz connection.json

echo "{\"path\":\"\",\"type\":\"external\",\"label\":\"${CHAINCODE_NAME}\"}" > metadata.json

tar cfz ${CHAINCODE_NAME}-${ORG}.tgz code.tar.gz metadata.json