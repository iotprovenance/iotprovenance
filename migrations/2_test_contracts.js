module.exports = (deployer, network, accounts) => {
  if (network !== "test") {
    return;
  }
  const ProvenanceStorageMock = artifacts.require("ProvenanceStorageMock");
  const ProvenanceMock = artifacts.require("ProvenanceMock");

  deployer.deploy(ProvenanceStorageMock);
  deployer.deploy(ProvenanceMock);

};
