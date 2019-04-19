const EthereumIotProvenance = require('./ethereum');
const PlasmaIotProvenance = require('./plasma');

function onPlasma(endpoint, chainId, contractAddress, privateKey) {
  return new PlasmaIotProvenance(endpoint, chainId, contractAddress, privateKey);
}

function onEthereum(endpoint, contractAddress, privateKey) {
  return new EthereumIotProvenance(endpoint, contractAddress, privateKey);
}

module.exports = {
  onPlasma,
  onEthereum
};