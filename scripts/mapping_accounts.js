const Web3 = require("web3");

const {
  LoomProvider,
  NonceTxMiddleware,
  SignedTxMiddleware,
  CryptoUtils,
  Address,
  LocalAddress,
  Client,
  Contracts,
  Web3Signer
} = require("loom-js");

const ethAddress = "0x08e9d1429c45573Eb26a9A73C18A600fA1102FD4";
const gateway = "ws://localhost:7545";

const privateKey = CryptoUtils.B64ToUint8Array(
  'YE93/G4VR4Hf/9ZcxGMKy3f+U3hcm5H/8vmWq2yGbqhmwaXgFI5dT6mt1HoYvf6AfWgPN3SDNI9CdX12c3H1UA=='
);
const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey);

const client = new Client(
  'default',
  'ws://127.0.0.1:46658/websocket',
  'ws://127.0.0.1:46658/queryws'
);

client.on('error', data => {
  console.error(data)
});

// required middleware
client.txMiddleware = [
  new NonceTxMiddleware(publicKey, client),
  new SignedTxMiddleware(privateKey)
];

Contracts.AddressMapper.createAsync(
  client,
  new Address(client.chainId, LocalAddress.fromPublicKey(publicKey))
).then(async (addressMapper) => {
  const from = new Address('eth', LocalAddress.fromHexString(ethAddress));
  const to = new Address(client.chainId, LocalAddress.fromPublicKey(publicKey));
  const dcAddress = '0x' + CryptoUtils.bytesToHex(to.local.bytes);

  const web3 = new Web3(new Web3(Web3.givenProvider || gateway));
  const web3Signer = new Web3Signer(web3, ethAddress);
  await addressMapper.addIdentityMappingAsync(from, to, web3Signer);

  const mapping = await addressMapper.getMappingAsync(from);

  console.log(`Created mapping between accounts: eth(${ethAddress}) -> dc(${dcAddress})`);
  process.exit();
})
.catch(err => {
  console.log(err);
  process.exit();
});
