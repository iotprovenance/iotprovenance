const IotProvenance = require("../index");
const path = require("path");
const fs = require("fs");

const NS_PER_SEC = 1e9;
const NS_PER_MILSEC = 1e6;

const GWEI_IN_WEI = 1000000000;

const GANACHE = "ganache";
const ROPSTEN = "ropsten";
const RINKEBY = "rinkeby";
const PLASMA  = "plasma";

const setup = async (network) => {
  if (network !== GANACHE &&
    network !== ROPSTEN &&
    network !== RINKEBY &&
    network !== PLASMA) {

    console.log("Please specify a network for the experiment ('ganache', 'ropsten', 'rinkeby', or 'plasma'");
    process.exit();
  }

  if (network === GANACHE) {
    let privateKey = "668c54c6ac94dfc68a1e5168e950450c0af4254076e20457269901cde2617005";
    let contractAddress = "0xba6380c87a5e0dbd09cbc8f2c4c4ee350688bfd6";
    let endpoint = "ws://localhost:7545";
    return IotProvenance.onEthereum(endpoint, contractAddress, privateKey);
  }

  if (network === ROPSTEN) {
    let privateKey = fs.readFileSync(path.join(__dirname, '../../ropsten_private_key'), 'utf-8');
    let contractAddress = "0xb8bfc1e38e789cf541160335b96c3e3878fa8bc7";
    let endpoint = `wss://ropsten.infura.io/ws`;
    return IotProvenance.onEthereum(endpoint, contractAddress, privateKey);
  }

  if (network === RINKEBY) {
    let privateKey = fs.readFileSync(path.join(__dirname, '../../rinkeby_private_key'), 'utf-8');
    let contractAddress = "0xd46e8ded7850879a7b30259417375b17e0221836";
    let endpoint = `wss://rinkeby.infura.io/ws`;
    return IotProvenance.onEthereum(endpoint, contractAddress, privateKey);
  }

  if (network === PLASMA) {
    let privateKey = 'lSTMzim6B/XYSCK+WGYQJcWORA8nJk6Na6i83JEiGhkqN1ck0mD2b9k0rdU2ISsrXauqFDGaz/5o8NTo52KL5Q==';
    let contractAddress = "0xb4042d02d9872734afc3dee7dc6b597f0b2ced6d";
    let endpoint = "wss://extdev-plasma-us1.dappchains.com";
    let chainId = "extdev-plasma-us1";

    return IotProvenance.onPlasma(endpoint, chainId, contractAddress, privateKey);
  }
};

const sidechainSetup = async () => {
  let ethereum, plasma;

  ethereum = await setup(RINKEBY);
  plasma = await setup(PLASMA);

  return {ethereum, plasma};
};

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

function hrtimeToMilliSeconds(hrtime) {
  return (hrtime[0] * NS_PER_SEC + hrtime[1]) / NS_PER_MILSEC;
}

function hrtimeToNanoSeconds(hrtime) {
  return (hrtime[0] * NS_PER_SEC + hrtime[1]);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  setup,
  sidechainSetup,
  getRandomInt,
  hrtimeToMilliSeconds,
  hrtimeToNanoSeconds,
  sleep,
  GANACHE,
  ROPSTEN,
  RINKEBY,
  PLASMA,
  GWEI_IN_WEI
};