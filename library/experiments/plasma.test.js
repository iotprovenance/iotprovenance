const IotProvenance = require("../index");
const { CryptoUtils, LocalAddress } = require("loom-js");

const setup = async () => {
  // Loom
// const privateKey = CryptoUtils.generatePrivateKey();
  let privateKey = 'YE93/G4VR4Hf/9ZcxGMKy3f+U3hcm5H/8vmWq2yGbqhmwaXgFI5dT6mt1HoYvf6AfWgPN3SDNI9CdX12c3H1UA==';
  let contractAddress = "0x18453ea59a2b4677937a1c4952c7744efaca9990";
  let endpoint = "ws://127.0.0.1:46658";
  let chainId = "default";


  privateKey = 'lSTMzim6B/XYSCK+WGYQJcWORA8nJk6Na6i83JEiGhkqN1ck0mD2b9k0rdU2ISsrXauqFDGaz/5o8NTo52KL5Q==';
  contractAddress = "0xb4042d02d9872734afc3dee7dc6b597f0b2ced6d";
  endpoint = "wss://extdev-plasma-us1.dappchains.com";
  chainId = "extdev-plasma-us1";

  return IotProvenance.onPlasma(endpoint, chainId, contractAddress, privateKey);
};

setup().then(async (iotprovenance) => {
  // let all = await iotprovenance.getAll();
  // console.log(all);
  let tokens = await iotprovenance.tokensOf();
  console.log(tokens);

  let ethTokenAddress = "0xd46e8ded7850879a7b30259417375b17e0221836";
  let ethOwnerAddress = "0xcbce6ab8829fff6f945a66c66b5cf58f7078f65c";
  let signature = await iotprovenance.withdrawToken(1, ethOwnerAddress, ethTokenAddress, 120000);
  console.log(signature);

  // let blockNumber = await iotprovenance.web3.eth.getBlockNumber();
  // console.log(`Block Number: ${blockNumber}`);

  // let {tokenId, signature} = await iotprovenance.pendingWithdrawal();
  // console.log(tokenId.toString(), signature);
  process.exit(0);
}).catch(err => {
  console.log(err);
  process.exit(0);
});

