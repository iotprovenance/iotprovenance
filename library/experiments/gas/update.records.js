const IotProvenance = require("../../index");
const fs = require("fs");

const setup = async () => {
  // Ethereum (Ganache)
  let privateKey = "668c54c6ac94dfc68a1e5168e950450c0af4254076e20457269901cde2617005";
  let contractAddress = "0xba6380c87a5e0dbd09cbc8f2c4c4ee350688bfd6";
  let endpoint = "ws://localhost:7545";

  return IotProvenance.onEthereum(endpoint, contractAddress, privateKey);

};

setup().then(async (iotprovenance) => {

  let fd = fs.openSync("./results/update-records.csv", "w");

  fs.writeSync(fd, "numberOfRecords;consumedGas\n");

  let tokens = await iotprovenance.tokensOf();
  console.log(tokens);

  let provenanceRecords = await iotprovenance.getAll();
  console.log(provenanceRecords.length);

  let tx = await iotprovenance.requestToken();
  console.log("Created token", tx.transactionHash);

  tx = await iotprovenance.requestToken();
  console.log("Created token", tx.transactionHash);

  for (let i of Array(1000).keys()) {
    console.log("-----------------------------------------");
    console.log("Creating new provenance entry...");
    await iotprovenance.createProvenance(1, "");
    console.log("Retrieving record to update...");
    const count = await iotprovenance.getProvenanceCount();
    let randomIndex = getRandomInt(0, count-1);
    let recordToUpdate = await iotprovenance.getProvenanceAtIndex(randomIndex);
    console.log(`Updating record ${recordToUpdate.id} (${JSON.stringify(recordToUpdate)})...`);
    const updatedToken = recordToUpdate.tokenId == 1 ? 2 : 1;
    console.log(`Updating token from ${recordToUpdate.tokenId} to ${updatedToken}...`);
    let tx = await iotprovenance.updateProvenance(recordToUpdate.id, updatedToken, "", []);
    fs.writeSync(fd, `${i+1};${tx.gasUsed}\n`);
    console.log(`Record ${recordToUpdate.id} updated. Gas used: ${tx.gasUsed}`);
  }

  fs.closeSync(fd);
  process.exit(0);

}).catch(err => {
  console.log(err);
  process.exit(0);
});


/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

