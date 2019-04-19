const {
  sidechainSetup, getRandomInt, hrtimeToMilliSeconds, hrtimeToNanoSeconds, sleep,
  GANACHE, ROPSTEN, RINKEBY, PLASMA, GWEI_IN_WEI
} = require("../utils");
const fs = require("fs");

const rinkebyGatewayAddress = '0x6f7Eb868b2236638c563af71612c9701AC30A388';

const NUMBER_OF_RUNS = 3; // no. of transactions
const GAS_PRICE_IN_GWEI = 10;


sidechainSetup().then(async (iotprovenance) => {
  let tokens = await iotprovenance.ethereum.tokensOf();
  if (tokens.length < 1) {
    console.log(`There are not enough tokens available to execute the experiment (at least 1 needed, actual ${tokens.length}).`);
    process.exit()
  }
  console.log(`${tokens.length} available tokens (${tokens})`);

  let resultFileDescriptor = fs.openSync(`./results/transfer-${GAS_PRICE_IN_GWEI}.csv`, "w");
  fs.writeSync(resultFileDescriptor, "run;deposit;withdraw\n");

  for (let i of Array(NUMBER_OF_RUNS).keys()) {
    let depositTime = await transferToPlasma(iotprovenance, tokens[0]);
    console.log(`Token deposited in ${hrtimeToMilliSeconds(depositTime)} milliseconds.`);

    let withdrawTime = await transferToEthereum(iotprovenance, tokens[0]);
    console.log(`Token withdrawn in ${hrtimeToMilliSeconds(depositTime)} milliseconds.`);
    fs.writeSync(resultFileDescriptor, `${i};${hrtimeToNanoSeconds(depositTime)};${hrtimeToNanoSeconds(withdrawTime)}\n`);

    await sleep(10000); // sleep for 10 seconds just in case
  }

  fs.closeSync(resultFileDescriptor);
  process.exit();

}).catch(err => {
  console.log(err);
  process.exit(0);
});

async function transferToPlasma(iotprovenance, token) {
  return new Promise(async (resolve, reject) => {

    iotprovenance.plasma.provenanceContract.instance.once('Transfer', {
      filter: {_tokenId: [token], myOtherIndexedParam: '0x123456789...'}, // Using an array means OR: e.g. 20 or 23
      fromBlock: 0
    }, (error, event) => {
      // console.log(event);
      let depositTime = process.hrtime(start);
      console.log(`Token ${token} has arrived at the Plasma chain...`);
      resolve(depositTime);
    });

    console.log(`Depositing token ${token} to gateway...`);
    let start = process.hrtime();
    let tx = await iotprovenance.ethereum.depositToken(token, rinkebyGatewayAddress);
    console.log(`Token ${token} deposited to gateway, waiting for plasma transfer...`);

  });

}

async function transferToEthereum(iotprovenance, token) {
  let ethOwnerAddress = iotprovenance.ethereum.ownerAddress;
  let ethTokenAddress = iotprovenance.ethereum.contractAddress;
  let timeout = 120000;
  console.log(`Withdrawing token ${token}...`);
  let start = process.hrtime();
  let signature = await iotprovenance.plasma.withdrawToken(token, ethOwnerAddress, ethTokenAddress, timeout);
  console.log(`Token ${token} deposited to DAppChain Gateway...`);

  const tx = await iotprovenance.ethereum.withdrawToken(token, signature, rinkebyGatewayAddress);
  let withdrawTime = process.hrtime(start);
  console.log(`Token ${token} withdrawn from Ethereum Gateway.`);
  // console.log(`Transaction hash: ${tx.transactionHash}`);
  return withdrawTime;
}



