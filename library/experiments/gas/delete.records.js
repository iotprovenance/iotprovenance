const IotProvenance = require("../../index");
const fs = require("fs");
const path = require("path");

const setup = async () => {
  // Ethereum (Ganache)
  let privateKey = "668c54c6ac94dfc68a1e5168e950450c0af4254076e20457269901cde2617005";
  let contractAddress = "0xba6380c87a5e0dbd09cbc8f2c4c4ee350688bfd6";
  let endpoint = "ws://localhost:7545";

  return IotProvenance.onEthereum(endpoint, contractAddress, privateKey);

};

setup().then(async (iotprovenance) => {

  let fd = fs.openSync("./results/delete-records.csv", "w");

  fs.writeSync(fd, "numberOfRecords;consumedGas\n");

  let provenanceRecords = await iotprovenance.getAll();

  for (let i of Array(provenanceRecords.length).keys()) {
    console.log("------------------------------------------------");
    let randomIndex = getRandomInt(0, provenanceRecords.length-1);
    let provToDelete = provenanceRecords[randomIndex];
    console.log(`Remaining provenance records: ${provenanceRecords.length}`);
    console.log(`Removing record ${provToDelete} (index ${randomIndex})`);

    let tx = await iotprovenance.deleteProvenance(provToDelete);
    fs.writeSync(fd, `${provenanceRecords.length};${tx.gasUsed}\n`);
    provenanceRecords.splice(randomIndex, 1);
    console.log(`Gas Used: ${tx.gasUsed}`);
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
