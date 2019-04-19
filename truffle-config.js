/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

const { readFileSync } = require('fs');
const path = require('path');
const LoomTruffleProvider = require('loom-truffle-provider');
const HDWalletProvider = require('truffle-hdwallet-provider');


module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  // solc: {
  //   optimizer: {
  //     enabled: true,
  //     runs: 2000
  //   }
  // },
  contracts_build_directory: path.join(__dirname, './library/contracts'),
  networks: {
    test: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      gas: 4700000
    },
    ethereum_dev: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
      gas: 4700000,
    },
    ethereum_rinkeby: {
      provider: function() {
        const mnemonic = readFileSync(path.join(__dirname, 'rinkeby_mnemonic'), 'utf-8');
        if (!process.env.INFURA_API_KEY) {
          throw new Error("INFURA_API_KEY env var not set");
        }
        return new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/${process.env.INFURA_API_KEY}`, 0, 10);
      },
      network_id: 4,
      gasPrice: 1500000000,
      skipDryRun: true
    },
    ethereum_ropsten: {
      provider: function() {
        const mnemonic = readFileSync(path.join(__dirname, 'ropsten_mnemonic'), 'utf-8');
        if (!process.env.INFURA_API_KEY) {
          throw new Error("INFURA_API_KEY env var not set");
        }
        return new HDWalletProvider(mnemonic, `https://ropsten.infura.io/${process.env.INFURA_API_KEY}`);
      },
      network_id: 3,
      gasPrice: 1500000000,
      skipDryRun: true
    },
    dappchain_dev: {
      provider: () => {
        const chainId    = 'default';
        const writeUrl   = 'http://127.0.0.1:46658/rpc';
        const readUrl    = 'http://127.0.0.1:46658/query';

        // ../dappchain/private_key file contains a base64 encoded key generated by the command:
        const privateKey = readFileSync('../dappchain/private_key', 'utf-8');
        const loomTruffleProvider = new LoomTruffleProvider(chainId, writeUrl, readUrl, privateKey);
        loomTruffleProvider.createExtraAccountsFromMnemonic("gravity top burden flip student usage spell purchase hundred improve check genre", 10);
        return loomTruffleProvider;
      },
      network_id: '*'
    },
    dappchain_extdev: {
      provider: () => {
        const privateKey = readFileSync(path.join(__dirname, 'extdev_private_key'), 'utf-8');
        const chainId = 'extdev-plasma-us1';
        const writeUrl = 'http://extdev-plasma-us1.dappchains.com:80/rpc';
        const readUrl = 'http://extdev-plasma-us1.dappchains.com:80/query';
        return new LoomTruffleProvider(chainId, writeUrl, readUrl, privateKey);
      },
      network_id: 'extdev-plasma-us1'
    }
  }
};