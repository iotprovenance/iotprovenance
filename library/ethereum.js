const IotProvenance = require('./base');
const GatewayContractJSON = require('./contracts/Gateway');
const Web3 = require('web3');

class EthereumIotProvenance extends IotProvenance {
  constructor(endpoint, contractAddress, privateKey) {
    const web3 = new Web3(Web3.givenProvider || endpoint);
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    super('Ethereum', web3, contractAddress, account.address);
  }

  async depositToken(tokenId, gatewayAddress, options) {
    return this.provenanceContract.depositToGateway(gatewayAddress, tokenId, options);
  }

  async withdrawToken(tokenId, signature, gatewayAddress, options = {
    gasPrice: 1000000000
  }) {
    const gatewayContract = new this.web3.eth.Contract(
      GatewayContractJSON.abi,
      gatewayAddress
    );

    const gasEstimate = await gatewayContract.methods
    .withdrawERC721(tokenId, signature, this.contractAddress)
    .estimateGas({
      from: this.ownerAddress
    });

    return gatewayContract.methods
    .withdrawERC721(tokenId, signature, this.contractAddress)
    .send({ from: this.ownerAddress, gas: gasEstimate, gasPrice: options.gasPrice });
  }
}

module.exports = EthereumIotProvenance;