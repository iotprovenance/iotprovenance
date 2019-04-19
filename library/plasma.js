const IotProvenance = require('./base');
const Web3 = require("web3");
const {
  Address, Client, CryptoUtils, Contracts,
  LocalAddress, LoomProvider, NonceTxMiddleware, SignedTxMiddleware, createJSONRPCClient
} = require('loom-js');
const BN = require('bn.js');

class PlasmaIotProvenance extends IotProvenance {
  constructor(
    endpoint, chainId, contractAddress, ownerPrivateKey
  ) {
    ownerPrivateKey = ownerPrivateKey ? CryptoUtils.B64ToUint8Array(ownerPrivateKey) : CryptoUtils.generatePrivateKey();
    const publicKey = CryptoUtils.publicKeyFromPrivateKey(ownerPrivateKey);
    const client = new Client(
      chainId,
      // "http://extdev-plasma-us1.dappchains.com:80/rpc",
      // "http://extdev-plasma-us1.dappchains.com:80/query",
      endpoint + '/websocket',
      createJSONRPCClient({
        protocols: [{ url: `${endpoint}/queryws` }],
        requestTimeout: 120000
      })
    // endpoint + '/queryws',
    );

    client.txMiddleware = [
      new NonceTxMiddleware(publicKey, client),
      new SignedTxMiddleware(ownerPrivateKey)
    ];

    client.on('error', msg => {
      console.error('Error on connect to client', msg);
      console.warn('Please verify if loom command is running');
    });

    const web3 = new Web3(new LoomProvider(client, ownerPrivateKey)); // Instantiate web3 client using LoomProvider
    const ownerAddress = LocalAddress.fromPublicKey(publicKey).toString(); // The address for the caller of the function
    super('Plasma', web3, contractAddress, ownerAddress);
    this.client = client;


  }

  // Returns a promise that will be resolved with a hex string containing the signature that must
  // be submitted to the Ethereum Gateway to withdraw a token.
  async withdrawToken(
    tokenId,
    ethOwnerAddress,
    ethTokenAddress,
    timeout
  ) {
    const TransferGateway = Contracts.TransferGateway;
    const plasmaOwnerAddr = Address.fromString(`${this.client.chainId}:${this.ownerAddress}`);
    const plasmaGatewayContract = await TransferGateway.createAsync(this.client, plasmaOwnerAddr);
    const plasmaGatewayAddress = CryptoUtils.bytesToHexAddr(plasmaGatewayContract.address.local.bytes);

    await this.approveToken(tokenId, plasmaGatewayAddress.toLowerCase());

    const ethOwnerAddr = Address.fromString(`eth:${ethOwnerAddress}`);
    const receiveSignedWithdrawalEvent = new Promise((resolve, reject) => {
      let timer = setTimeout(
        () => reject(new Error('Timeout while waiting for withdrawal to be signed')),
        timeout
      );
      const listener = event => {
        const ethTokenAddr = Address.fromString(`eth:${ethTokenAddress}`);
        if (
          event.tokenContract.toString() === ethTokenAddr.toString() &&
          event.tokenOwner.toString() === ethOwnerAddr.toString()
        ) {
          clearTimeout(timer);
          timer = null;
          plasmaGatewayContract.removeAllListeners(TransferGateway.EVENT_TOKEN_WITHDRAWAL);
          resolve(event);
        }
      };
      plasmaGatewayContract.on(TransferGateway.EVENT_TOKEN_WITHDRAWAL, listener);
    });

    const plasmaTokenAddr = Address.fromString(`${this.client.chainId}:${this.contractAddress}`);
    await plasmaGatewayContract.withdrawERC721Async(new BN(tokenId), plasmaTokenAddr, ethOwnerAddr);

    const event = await receiveSignedWithdrawalEvent;
    return CryptoUtils.bytesToHexAddr(event.sig);
  }

  async pendingWithdrawal() {
    const TransferGateway = Contracts.TransferGateway;
    const ownerAddr = Address.fromString(`${this.client.chainId}:${this.ownerAddress}`);
    const gatewayContract = await TransferGateway.createAsync(this.client, ownerAddr);
    const receipt = await gatewayContract.withdrawalReceiptAsync(ownerAddr);
    if (!receipt) throw "No pending withdrawals";
    return {tokenId: receipt.tokenId, signature: CryptoUtils.bytesToHexAddr(receipt.oracleSignature)};
  }
}

module.exports = PlasmaIotProvenance;