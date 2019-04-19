const {
  setup, getRandomInt, hrtimeToMilliSeconds, hrtimeToNanoSeconds, sleep,
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
const TEST_NETWORK = RINKEBY;
const NUMBER_OF_RUNS = 20; // no. of runs
const TIME_FRAME = 60; // seconds
const NUMBER_OF_TRANSACTIONS = 150; // no. of transactions
const GAS_PRICE_IN_GWEI = 0.5;
const COOLDOWN = 20; // seconds


setup(TEST_NETWORK).then(async (iotprovenance) => {

  let tokens = await iotprovenance.tokensOf();
  if (tokens.length < 1) {
    console.log(`There are not enough tokens available to execute the experiment (at least 1 needed, actual ${tokens.length}).`);
    process.exit()
  }
  console.log(`${tokens.length} available tokens (${tokens})`);

  let resultFileDescriptor = fs.openSync(`./results/throughput-${TEST_NETWORK}-create-${GAS_PRICE_IN_GWEI}.csv`, "w");
  fs.writeSync(resultFileDescriptor, "run;timeframe;submitted;confirmed;pending\n");

  let nonce;
  if (TEST_NETWORK === PLASMA) {
    let receipt = await iotprovenance.createProvenance(tokens[0], "", [], {
      gasPrice: GAS_PRICE_IN_GWEI * GWEI_IN_WEI,
      wait: true
    });
    let tx = await iotprovenance.web3.eth.getTransaction(receipt.transactionHash);
    nonce = tx.nonce + 1;
  } else {
    nonce = await iotprovenance.web3.eth.getTransactionCount(iotprovenance.ownerAddress);
  }
  console.log(`Current transaction count: ${nonce}`);

  for (let i of Array(NUMBER_OF_RUNS).keys()) {
    console.log(`Run ${i}:`);

    nonce = await executeRun(i, iotprovenance, tokens, nonce, resultFileDescriptor);

  }
  fs.closeSync(resultFileDescriptor);
  process.exit();

}).catch(err => {
  console.log(err);
  process.exit(0);
});

async function executeRun(noOfRun, iotprovenance, tokens, nonce, resultFileDescriptor) {
  return new Promise(async (resolve, reject) => {
    let txHashes = [];
    let timeOver = false;

    // start the timeout
    console.log("Timeout started");
    setTimeout(async () => {
      timeOver = true;
      console.log(`Timeframe over, collecting info of ${txHashes.length} transactions...`);
      let time = process.hrtime();
      let txReceipts = [];
      for (let txHash of txHashes) {
        let txReceipt = await iotprovenance.web3.eth.getTransactionReceipt(txHash);
        console.log(`Receipt of ${txHash}: ${!!txReceipt}`);
        txReceipts.push(txReceipt);
      }

      let diff = process.hrtime(time);
      console.log(`Collected info of ${txReceipts.length} transactions in ${hrtimeToMilliSeconds(diff)} milliseconds`);
      let processedCounter = 0;
      let pendingCounter = txReceipts.length;
      txReceipts.forEach(receipt => {
        if (receipt) {
          processedCounter++;
          pendingCounter--;
        }
      });
      let totalTime = TIME_FRAME * 1000000000 + hrtimeToNanoSeconds(diff);
      console.log(`
      ${txReceipts.length} total submitted transactions: ${processedCounter} confirmed, ${pendingCounter} pending`);
      console.log(`TPS = ${processedCounter / (totalTime/1000000000)}`);
      console.log(`
      ${noOfRun};${totalTime};${txReceipts.length};${processedCounter};${pendingCounter}`);
      fs.writeSync(resultFileDescriptor, `${noOfRun};${totalTime};${txReceipts.length};${processedCounter};${pendingCounter}\n`);
      console.log(`Waiting for all submitted transactions to be confirmed...`);
      while (!await iotprovenance.web3.eth.getTransactionReceipt(txHashes[txHashes.length-1])) {
        sleep(2000);
      }
      console.log(`All transactions have been confirmed. Finishing run...`);
      sleep(COOLDOWN * 1000);
      resolve(nonce);

    }, TIME_FRAME * 1000);

    // start the transactions
    console.log(`Sending ${NUMBER_OF_TRANSACTIONS} transactions...`);
    for (let j of Array(NUMBER_OF_TRANSACTIONS).keys()) {
      if (timeOver) {
        break;
      }
      let hash = await iotprovenance.createProvenance(tokens[0], "", [], {
        gasPrice: GAS_PRICE_IN_GWEI * GWEI_IN_WEI,
        wait: false,
        nonce: nonce
      });
      console.log(`Transaction ${j+1} (Hash: ${hash})`);
      txHashes.push(hash);
      nonce = nonce + 1;
      // let tx = await iotprovenance.web3.eth.getTransaction(hash);
      // console.log("Transaction", tx);
      // let txReceipt = await iotprovenance.web3.eth.getTransactionReceipt(hash);
      // console.log("Transaction Receipt", txReceipt);
      // await sleep(10);
      // iotprovenance.createProvenance(tokens[0], "", [], {
      //   gasPrice: GAS_PRICE_IN_GWEI * GWEI_IN_WEI,
      //   nonce: nonce,
      //   wait: false
      // }).then(tx => {
      //   if (!timeOver) {
      //     console.log("Collecting transaction hash");
      //     txHashes.push(tx.transactionHash);
      //   }
      // });
    }
  })
}


