const ProvenanceMainnet = artifacts.require("ProvenanceMainnet");
const Gateway = artifacts.require("Gateway");
const { writeFileSync, readFileSync } = require('fs');


module.exports = (deployer, network, accounts) => {
  if (network === "live") {
    return;
  }

  if (network === "ethereum_dev") {
    console.log("Deploying contracts to Mainnet (Ganache)");
    // const [_, user] = accounts;
    const validator = accounts[9];
    deployer.deploy(Gateway, [validator], 3, 4).then(async () => {
      const gatewayInstance = await Gateway.deployed();

      console.log(`Gateway deployed at address: ${gatewayInstance.address}`);

      const provenanceContract = await deployer.deploy(ProvenanceMainnet, gatewayInstance.address);
      const provenanceInstance = await ProvenanceMainnet.deployed();

      console.log(`Provenance deployed at address: ${provenanceInstance.address}`);
      console.log(`Provenance transaction at hash: ${provenanceContract.transactionHash}`);

      await gatewayInstance.toggleToken(provenanceInstance.address, { from: validator });
      // await cryptoCardsInstance.register(user)

      writeFileSync('../gateway_address', gatewayInstance.address);
      writeFileSync('../provenance_address', provenanceInstance.address);
      writeFileSync('../provenance_tx_hash', provenanceContract.transactionHash);
    });
  }

  if (network === "ethereum_rinkeby") {
    deployer.then(async () => {
      await deployer.deploy(ProvenanceMainnet);
      const provenanceInstance = await ProvenanceMainnet.deployed();

      console.log('\n*************************************************************************\n');
      console.log(`Provenance Contract Address (Rinkeby): ${provenanceInstance.address}`);
      console.log('\n*************************************************************************\n');
    })
  }

  if (network === "ethereum_ropsten") {
    deployer.then(async () => {
      await deployer.deploy(ProvenanceMainnet);
      const provenanceInstance = await ProvenanceMainnet.deployed();

      console.log('\n*************************************************************************\n');
      console.log(`Provenance Contract Address (Ropsten): ${provenanceInstance.address}`);
      console.log('\n*************************************************************************\n');
    })
  }


};
