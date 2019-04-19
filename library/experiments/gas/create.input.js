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

  let fd = fs.openSync("./results/create-input.csv", "w");

  fs.writeSync(fd, "inputProvenanceSize;consumedGas\n");

  let tokens = await iotprovenance.tokensOf();
  console.log(tokens);

  let provRecords = await iotprovenance.getAll();
  console.log(provRecords);

  // let tx = await iotprovenance.requestToken();
  // console.log("Created token", tx.transactionHash);

  let inputProvenanceIds = [];
  for (let i of Array(100).keys()) {
    console.log("input provenance", inputProvenanceIds);
    let tx = await iotprovenance.createProvenance(1, "", inputProvenanceIds);
    fs.writeSync(fd, `${i};${tx.gasUsed}\n`);
    inputProvenanceIds.push(i+1);
  }

  fs.closeSync(fd);
  process.exit(0);

}).catch(err => {
  console.log(err);
  process.exit(0);
});

