const {
  setup, getRandomInt, hrtimeToMilliSeconds, hrtimeToNanoSeconds,
  GANACHE, ROPSTEN, RINKEBY, PLASMA, GWEI_IN_WEI
} = require("../utils");
const fs = require("fs");
const BN = require("bn.js");

/****** README ******
 * To perform the experiment, set the TEST_NETWORK constant to any of the constants defined above:
 *  - GANACHE (local Ethereum instance)
 *  - ROPSTEN (PoW Ethereum test network)
 *  - RINKEBY (PoA Ethereum test network)
 *  - PLASMA  (Loom DAppChain test network "extdev")
 */
const TEST_NETWORK = PLASMA;
const NUMBER_OF_RUNS = 100;
const GAS_PRICE_IN_GWEI = 10;


setup(TEST_NETWORK).then(async (iotprovenance) => {

  // let tx = await iotprovenance.requestToken();
  // console.log(tx);

  let tokens = await iotprovenance.tokensOf();
  if (tokens.length < 1) {
    console.log(`There are not enough tokens available to execute the experiment (at least 1 needed, actual ${tokens.length}).`);
    process.exit()
  }
  console.log(`${tokens.length} available tokens (${tokens})`);

  let resultFileDescriptor = fs.openSync(`./results/${TEST_NETWORK}-create-latency-${GAS_PRICE_IN_GWEI}.csv`, "w");
  fs.writeSync(resultFileDescriptor, "run;confirmationTime;gasUsed;gasPrice;gasCosts\n");

  for (let i of Array(NUMBER_OF_RUNS).keys()) {
    console.log(`Run ${i}:`);

    let time = process.hrtime();
    let tx = await iotprovenance.createProvenance(tokens[0], "", [], {gasPrice: GAS_PRICE_IN_GWEI * GWEI_IN_WEI});
    let diff = process.hrtime(time);

    console.log("Retrieving Transaction Data...");
    let transaction = await iotprovenance.web3.eth.getTransaction(tx.transactionHash);
    let txReceipt;
    while (!txReceipt) {
      txReceipt = await iotprovenance.web3.eth.getTransactionReceipt(tx.transactionHash);
    }
    // console.log(transaction);
    // console.log(txReceipt);
    const gasUsed = new BN(txReceipt.gasUsed);
    const gasPrice = new BN(transaction.gasPrice);
    const gasCosts = gasUsed.mul(gasPrice);
    fs.writeSync(resultFileDescriptor, `${i};${hrtimeToNanoSeconds(diff)};${gasUsed.toString()};${gasPrice.toString()};${gasCosts.toString()}\n`);
    console.log(`Benchmark took ${hrtimeToMilliSeconds(diff)} milliseconds`);
    console.log(`Transaction Cost (Gas Used x Gas Price): ${gasUsed.toString()} x ${gasPrice.toString()} = ${gasCosts.toString()} Wei (${iotprovenance.web3.utils.fromWei(gasCosts)} ETH)`);
  }

  fs.closeSync(resultFileDescriptor);
  process.exit(0);

}).catch(err => {
  console.log(err);
  process.exit(0);
});



