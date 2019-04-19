const { readFileSync } = require('fs');
const Web3 = require('web3');

const {
  NonceTxMiddleware, SignedTxMiddleware, Client, Address, Contracts,
  LocalAddress, CryptoUtils, createJSONRPCClient, Web3Signer, soliditySha3
} = require('loom-js');

const provenanceAddress = readFileSync('../provenance_address', 'utf-8');
const provenanceDAppChainAddress = readFileSync('../provenance_dappchain_address', 'utf-8');
const provenanceTx = readFileSync('../provenance_tx_hash', 'utf-8')

;(async () => {
  const privateKey = CryptoUtils.B64ToUint8Array(readFileSync('../dappchain/private_key', 'utf-8'));
  const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey);

  const chainId  = 'default';
  const writeUrl = 'http://127.0.0.1:46658/rpc';
  const readUrl  = 'http://127.0.0.1:46658/query';

  const writer = createJSONRPCClient({ protocols: [{ url: writeUrl }] });
  const reader = createJSONRPCClient({ protocols: [{ url: readUrl }] });
  const client = new Client(chainId, writer, reader);

  client.on('error', msg => {
    console.error('Error on connect to client', msg);
    console.warn('Please verify if loom command is running');
  });

  console.log('Client created');

  // required middleware
  client.txMiddleware = [
    new NonceTxMiddleware(publicKey, client),
    new SignedTxMiddleware(privateKey)
  ];

  const transferGateway = await Contracts.TransferGateway.createAsync(
    client,
    new Address(client.chainId, LocalAddress.fromPublicKey(publicKey))
  );

  console.log('Transfer Gateway client created');

  const foreignContract = new Address('eth', LocalAddress.fromHexString(provenanceAddress));
  const localContract = new Address(
    client.chainId, LocalAddress.fromHexString(provenanceDAppChainAddress)
  );

  const web3 = new Web3('http://localhost:7545');
  const accounts = await web3.eth.getAccounts();
  const owner = accounts[0];

  console.log('Account used for sign', owner);

  const web3Signer = new Web3Signer(web3, owner);
  const hash = soliditySha3(
    { type: 'address', value: foreignContract.local.toString().slice(2) },
    { type: 'address', value: localContract.local.toString().slice(2) }
  );


  const foreignContractCreatorSig = await web3Signer.signAsync(hash);

  console.log(`Sign foreign contract and local contracts ${provenanceAddress} ${provenanceDAppChainAddress}`);

  const foreignContractCreatorTxHash = Buffer.from(provenanceTx.slice(2), 'hex');

  await transferGateway.addContractMappingAsync({
    foreignContract,
    localContract,
    foreignContractCreatorSig,
    foreignContractCreatorTxHash
  });
})();
