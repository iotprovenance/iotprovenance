const abi = require("../truffle-contracts/build/contracts/Gateway.json").abi;
const Web3 = require("web3");

const web3 = new Web3("ws://localhost:7545");
const gatewayInstance = new web3.eth.Contract(abi, "0x8838a72c7d57d2e5e1cdc732b8110a7c2c788a41");

// const gatewayInstance = GatewayContract.at("0x838b091980b102d54e7e7162f176e6e41bdcc210");

const receivedEvent = gatewayInstance.events.ERC721Received(null ,{fromBlock: 0, toBlock: 'latest'});
receivedEvent.on("data", event => {
  console.log(event);
});

receivedEvent.on("error", error => {
  console.log(error);
});

const gatewayInstance.methods.
