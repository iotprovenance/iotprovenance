const ProvenanceDAppChain = artifacts.require("ProvenanceDAppChain");
const { writeFileSync, readFileSync } = require('fs');


module.exports = (deployer, network, accounts) => {
  if (network === "live") {
    return;
  }

  if (network === "dappchain_dev") {
    const gatewayAddress = readFileSync('../gateway_dappchain_address', 'utf-8');

    deployer.deploy(ProvenanceDAppChain, gatewayAddress).then(async () => {
      const provenanceDAppChainInstance = await ProvenanceDAppChain.deployed();
      console.log(`ProvenanceDAppChain deployed at address: ${provenanceDAppChainInstance.address}`);
      writeFileSync('../provenance_dappchain_address', provenanceDAppChainInstance.address);
    });
  }

  if (network === "dappchain_extdev") {
    const gatewayAddress = '0xE754d9518bF4a9C63476891eF9Aa7D91c8236a5d';

    deployer.then(async () => {
      await deployer.deploy(ProvenanceDAppChain, gatewayAddress);
      const provenanceInstance = await ProvenanceDAppChain.deployed();

      console.log('\n*************************************************************************\n');
      console.log(`Provenance Contract Address: ${provenanceInstance.address}`);
      console.log('\n*************************************************************************\n');
    })
  }


};
