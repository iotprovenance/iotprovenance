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
const NUMBER_OF_RUNS = 31;
const GAS_PRICE_IN_GWEI = 0.5;

setup(TEST_NETWORK).then(async (iotprovenance) => {
  let tokens = await iotprovenance.tokensOf();
  console.log(tokens);

  let count = await iotprovenance.getProvenanceCount(tokens[0]);
  console.log(`Token ${tokens[0]} has ${count} associated provenance records`);

  if (tokens.length < 2) {
    console.log(`There are not enough tokens available to execute the experiment (at least 2 needed, actual ${tokens.length}).`);
    process.exit()
  }

  if (count < 1) {
    console.log(`There are not enough provenance records available to execute the experiment (at least 1 needed, actual ${count}).`);
    process.exit();
  }

  let fd = fs.openSync(`./results/${TEST_NETWORK}-update-latency-${GAS_PRICE_IN_GWEI}.csv`, "w");
  fs.writeSync(fd, "run;confirmationTime;gasUsed;gasPrice;gasCosts\n");

  for (let i of Array(NUMBER_OF_RUNS).keys()) {
    console.log(`Run ${i}:`);

    count = await iotprovenance.getProvenanceCount(tokens[0]);
    console.log(`Token ${tokens[0]} has ${count} associated provenance records`);

    let randomIndex = getRandomInt(0, count-1);
    let recordToUpdate = await iotprovenance.getProvenanceOfTokenAtIndex(tokens[0], randomIndex);
    console.log(`Updating record ${recordToUpdate.id} (${JSON.stringify(recordToUpdate)})...`);

    let time = process.hrtime();
    let tx = await iotprovenance.updateProvenance(
      recordToUpdate.id,
      recordToUpdate.tokenId === tokens[0] ? tokens[1] : tokens[0],
      "",
      [],
      {gasPrice: GAS_PRICE_IN_GWEI * GWEI_IN_WEI});
    let diff = process.hrtime(time);

    console.log("Retrieving Transaction Data...");
    let transaction;
    while (!transaction) {
      transaction = await iotprovenance.web3.eth.getTransaction(tx.transactionHash);
    }
    let txReceipt;
    while (!txReceipt) {
      txReceipt = await iotprovenance.web3.eth.getTransactionReceipt(tx.transactionHash);
    }
    // console.log(transaction);
    // console.log(txReceipt);
    const gasUsed = new BN(txReceipt.gasUsed);
    const gasPrice = new BN(transaction.gasPrice);
    const gasCosts = gasUsed.mul(gasPrice);
    fs.writeSync(fd, `${i};${hrtimeToNanoSeconds(diff)};${gasUsed.toString()};${gasPrice.toString()};${gasCosts.toString()}\n`);
    console.log(`Benchmark took ${hrtimeToMilliSeconds(diff)} milliseconds`);
    console.log(`Transaction Cost (Gas Used x Gas Price): ${gasUsed.toString()} x ${gasPrice.toString()} = ${gasCosts.toString()} Wei (${iotprovenance.web3.utils.fromWei(gasCosts)} ETH)`);
  }

  fs.closeSync(fd);
  process.exit(0);

}).catch(err => {
  console.log(err);
  process.exit(0);
});



