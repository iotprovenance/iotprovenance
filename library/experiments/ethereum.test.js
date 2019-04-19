const IotProvenance = require("../index");
const fs = require("fs");
const path = require("path");
const {setup, ROPSTEN, RINKEBY, GANACHE, GWEI_IN_WEI} = require("./utils");

// const setup = async () => {
//   // Ethereum (Ganache)
//   let privateKey = "668c54c6ac94dfc68a1e5168e950450c0af4254076e20457269901cde2617005";
//   let contractAddress = "0xba6380c87a5e0dbd09cbc8f2c4c4ee350688bfd6";
//   let endpoint = "ws://localhost:7545";
//
//   // Ethereum (Rinkeby)
//   // privateKey = fs.readFileSync(path.join(__dirname, '../../rinkeby_private_key'), 'utf-8');
//   // contractAddress = "0xd46e8ded7850879a7b30259417375b17e0221836";
//   // endpoint = `wss://rinkeby.infura.io/ws`;
//
//   // Ethereum (Ropsten)
//   privateKey = fs.readFileSync(path.join(__dirname, '../../ropsten_private_key'), 'utf-8');
//   contractAddress = "0xb8bfc1e38e789cf541160335b96c3e3878fa8bc7";
//   endpoint = `wss://ropsten.infura.io/ws`;
//
//
//   return IotProvenance.onEthereum(endpoint, contractAddress, privateKey);
//
// };
const GAS_PRICE_IN_GWEI = 1;
const TEST_NETWORK = GANACHE;

setup(TEST_NETWORK).then(async (iotprovenance) => {
  const rinkebyGatewayAddress = '0x6f7Eb868b2236638c563af71612c9701AC30A388';

  let all = await iotprovenance.getAll();
  console.log(all);

  let tx;
  // tx = await iotprovenance.requestToken();
  // console.log(tx);

  let tokens = await iotprovenance.tokensOf();
  console.log(tokens);

  // tx = await iotprovenance.createProvenance(tokens[0], "", [], {gasPrice: GAS_PRICE_IN_GWEI * GWEI_IN_WEI});
  // console.log(tx);

  tx = await iotprovenance.updateProvenance(1, 2, "", [], {gasPrice: GAS_PRICE_IN_GWEI * GWEI_IN_WEI});
  console.log(tx);

  // tx = await iotprovenance.authorize("0x435161Bc1401Ab4Fcba2F3ca561a91a9de8309b0", true);
  // console.log(tx);

  // let tx = await iotprovenance.depositToken(5, rinkebyGatewayAddress);
  // console.log(tx);

  // const signature = "0x00E864306A19CAEC0909C6068D86E5C27AD94441D58A7D367DF3C89F19C373BDBC546B79F27D59246B23D6061E1F71640E52F3615A7EAB66606BAFF63B2A058A101C";
  // tx = await iotprovenance.withdrawToken(1, signature, rinkebyGatewayAddress);
  // console.log(tx);
  process.exit(0);

}).catch(err => {
  console.log(err);
  process.exit(0);
});

