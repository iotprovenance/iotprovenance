/*
  BSD 3-Clause License

  Copyright (c) 2018, Loom Network
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.

  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

  * Neither the name of the copyright holder nor the names of its
    contributors may be used to endorse or promote products derived from
    this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
  FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
  DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
  SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
  CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
  OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const Web3 = require('web3');
const program = require('commander');
const fs = require('fs');
const path = require('path');
const {
    Client, NonceTxMiddleware, SignedTxMiddleware, Address, LocalAddress, CryptoUtils, LoomProvider,
    Contracts, Web3Signer, soliditySha3
} = require('loom-js');
// TODO: fix this export in loom-js
const { OfflineWeb3Signer } = require('loom-js/dist/solidity-helpers');
const BN = require('bn.js');


const ProvenanceMainnetJSON = require('../library/contracts/ProvenanceMainnet.json');
const ProvenanceDAppChainJSON = require('../library/contracts/ProvenanceDAppChain.json');
const RinkebyGatewayJSON = require('../library/contracts/Gateway.json');

const TransferGateway = Contracts.TransferGateway;
const AddressMapper = Contracts.AddressMapper;

// See https://loomx.io/developers/docs/en/testnet-plasma.html#contract-addresses-transfer-gateway
// for the most up to date address.
const rinkebyGatewayAddress = '0x6f7Eb868b2236638c563af71612c9701AC30A388';
const extdevGatewayAddress = '0xE754d9518bF4a9C63476891eF9Aa7D91c8236a5d';
const extdevChainId = 'extdev-plasma-us1';

async function getRinkebyTokenContract(web3js) {
  const networkId = await web3js.eth.net.getId();
  return new web3js.eth.Contract(
    ProvenanceMainnetJSON.abi,
    ProvenanceMainnetJSON.networks[networkId].address
  );
}

// Returns an object containing the total number of tokens owned by the given account,
// and up to 5 token IDs.
async function getRinkebyTokenBalance(web3js, accountAddress) {
  const contract = await getRinkebyTokenContract(web3js);
  const total = await contract.methods
    .balanceOf(accountAddress)
    .call();
  const tokens = [];
  for (let i = 0; i < Math.min(total, 5); i++) {
    const tokenId = await contract.methods
      .tokenOfOwnerByIndex(accountAddress, i)
      .call();
    tokens.push(tokenId);
  }
  return { total, tokens }
}

async function mintToken(web3js, tokenId, ownerAccount, gas) {
  const contract = await getRinkebyTokenContract(web3js);

  const gasEstimate = await contract.methods
    .requestToken()
    .estimateGas({ from: ownerAccount, gas });

  if (gasEstimate == gas) {
    throw new Error('Not enough enough gas, send more.')
  }

  return contract.methods
    .requestToken()
    .send({ from: ownerAccount, gas: gasEstimate });
}

async function depositTokenToGateway(web3js, tokenId, ownerAccount, gas) {
  const contract = await getRinkebyTokenContract(web3js);
  
  const gasEstimate = await contract.methods
    .depositToGateway(rinkebyGatewayAddress, tokenId)
    .estimateGas({ from: ownerAccount, gas });
  if (gasEstimate == gas) {
    throw new Error('Not enough enough gas, send more.');
  }

  return contract.methods
    .depositToGateway(rinkebyGatewayAddress, tokenId)
    .send({ from: ownerAccount, gas: gasEstimate });
}

function getExtdevTokenContract(web3js) {
  // NOTE: web3js.eth.net.getId() will throw an error due to a non-numeric net ID, so don't call it.
  return new web3js.eth.Contract(
    ProvenanceDAppChainJSON.abi,
    ProvenanceDAppChainJSON.networks[extdevChainId].address,
  );
}

async function getExtdevTokenBalance(web3js, accountAddress) {
  const contract = getExtdevTokenContract(web3js);
  const addr = accountAddress.toLowerCase();
  const total = await contract.methods
    .balanceOf(addr)
    .call({ from: addr });
  const tokens = [];
  for (let i = 0; i < Math.min(total, 5); i++) {
    const tokenId = await contract.methods
      .tokenOfOwnerByIndex(addr, i)
      .call({ from: addr });
    tokens.push(tokenId);
  }
  return { total, tokens };
}

// Returns a promise that will be resolved with a hex string containing the signature that must
// be submitted to the Ethereum Gateway to withdraw a token.
async function depositTokenToExtdevGateway({
  client, web3js, tokenId,
  ownerExtdevAddress, ownerRinkebyAddress,
  tokenExtdevAddress, tokenRinkebyAddress, timeout
}) {
  const ownerExtdevAddr = Address.fromString(`${client.chainId}:${ownerExtdevAddress}`);
  const gatewayContract = await TransferGateway.createAsync(client, ownerExtdevAddr);
  
  const coinContract = getExtdevTokenContract(web3js);
  await coinContract.methods
    .approve(extdevGatewayAddress.toLowerCase(), tokenId)
    .send({ from: ownerExtdevAddress });
  
  const ownerRinkebyAddr = Address.fromString(`eth:${ownerRinkebyAddress}`);
  const receiveSignedWithdrawalEvent = new Promise((resolve, reject) => {
    let timer = setTimeout(
      () => reject(new Error('Timeout while waiting for withdrawal to be signed')),
      timeout
    );
    const listener = event => {
      const tokenEthAddr = Address.fromString(`eth:${tokenRinkebyAddress}`);
      if (
        event.tokenContract.toString() === tokenEthAddr.toString() &&
        event.tokenOwner.toString() === ownerRinkebyAddr.toString()
      ) {
        clearTimeout(timer);
        timer = null;
        gatewayContract.removeAllListeners(TransferGateway.EVENT_TOKEN_WITHDRAWAL);
        resolve(event);
      }
    };
    gatewayContract.on(TransferGateway.EVENT_TOKEN_WITHDRAWAL, listener);
  });

  const tokenExtdevAddr = Address.fromString(`${client.chainId}:${tokenExtdevAddress}`);
  await gatewayContract.withdrawERC721Async(new BN(tokenId), tokenExtdevAddr, ownerRinkebyAddr);

  const event = await receiveSignedWithdrawalEvent;
  return CryptoUtils.bytesToHexAddr(event.sig);
}

async function getPendingWithdrawalReceipt(client, ownerAddress) {
  const ownerAddr = Address.fromString(`${client.chainId}:${ownerAddress}`);
  const gatewayContract = await TransferGateway.createAsync(client, ownerAddr);
  return gatewayContract.withdrawalReceiptAsync(ownerAddr);
}

async function getRinkebyGatewayContract(web3js) {
  const networkId = await web3js.eth.net.getId();
  return new web3js.eth.Contract(
    RinkebyGatewayJSON.abi,
    RinkebyGatewayJSON.networks[networkId].address
  );
}

async function withdrawTokenFromRinkebyGateway({ web3js, tokenId, accountAddress, signature, gas }) {
  const gatewayContract = await getRinkebyGatewayContract(web3js);
  const networkId = await web3js.eth.net.getId();

  const gasEstimate = await gatewayContract.methods
    .withdrawERC721(tokenId, signature, ProvenanceMainnetJSON.networks[networkId].address)
    .estimateGas({ from: accountAddress, gas });

  if (gasEstimate == gas) {
    throw new Error('Not enough enough gas, send more.');
  }

  return gatewayContract.methods
    .withdrawERC721(tokenId, signature, ProvenanceMainnetJSON.networks[networkId].address)
    .send({ from: accountAddress, gas: gasEstimate });
}

function loadRinkeyAccount() {
  const privateKey = fs.readFileSync(path.join(__dirname, '../rinkeby_private_key'), 'utf-8');
  const web3js = new Web3(`https://rinkeby.infura.io/${process.env.INFURA_API_KEY}`);
  const ownerAccount = web3js.eth.accounts.privateKeyToAccount('0x' + privateKey);
  web3js.eth.accounts.wallet.add(ownerAccount);
  return { account: ownerAccount, web3js };
}

function loadExtdevAccount() {
  const privateKeyStr = fs.readFileSync(path.join(__dirname, '../extdev_private_key'), 'utf-8');
  const privateKey = CryptoUtils.B64ToUint8Array(privateKeyStr);
  const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey);
  const client = new Client(
    extdevChainId,
    'wss://extdev-plasma-us1.dappchains.com/websocket',
    'wss://extdev-plasma-us1.dappchains.com/queryws'
  );
  client.txMiddleware = [
    new NonceTxMiddleware(publicKey, client),
    new SignedTxMiddleware(privateKey)
  ];
  client.on('error', msg => {
    console.error('PlasmaChain connection error', msg)
  });
 
  return {
    account: LocalAddress.fromPublicKey(publicKey).toString(),
    web3js: new Web3(new LoomProvider(client, privateKey)),
    client
  };
}

async function mapContracts({
  client,
  signer,
  tokenRinkebyAddress,
  tokenExtdevAddress,
  ownerExtdevAddress,
  rinkebyTxHash
}) {
  const ownerExtdevAddr = Address.fromString(`${client.chainId}:${ownerExtdevAddress}`);
  const gatewayContract = await TransferGateway.createAsync(client, ownerExtdevAddr);
  const foreignContract = Address.fromString(`eth:${tokenRinkebyAddress}`);
  const localContract = Address.fromString(`${client.chainId}:${tokenExtdevAddress}`);
  
  const hash = soliditySha3(
    { type: 'address', value: tokenRinkebyAddress.slice(2) },
    { type: 'address', value: tokenExtdevAddress.slice(2) }
  );

  const foreignContractCreatorSig = await signer.signAsync(hash);
  const foreignContractCreatorTxHash = Buffer.from(rinkebyTxHash.slice(2), 'hex');

  await gatewayContract.addContractMappingAsync({
    localContract,
    foreignContract,
    foreignContractCreatorSig,
    foreignContractCreatorTxHash
  });
}

async function mapAccounts({ client, signer, ownerRinkebyAddress, ownerExtdevAddress }) {
  const ownerRinkebyAddr = Address.fromString(`eth:${ownerRinkebyAddress}`);
  const ownerExtdevAddr = Address.fromString(`${client.chainId}:${ownerExtdevAddress}`);
  const mapperContract = await AddressMapper.createAsync(client, ownerExtdevAddr);
  
  try {
    const mapping = await mapperContract.getMappingAsync(ownerExtdevAddr);
    console.log(`${mapping.from.toString()} is already mapped to ${mapping.to.toString()}`);
    return;
  } catch (err) {
    // assume this means there is no mapping yet, need to fix loom-js not to throw in this case
  }
  console.log(`mapping ${ownerRinkebyAddr.toString()} to ${ownerExtdevAddr.toString()}`);
  await mapperContract.addIdentityMappingAsync(ownerExtdevAddr, ownerRinkebyAddr, signer);
  console.log(`Mapped ${ownerExtdevAddr} to ${ownerRinkebyAddr}`);
}

  program
  .command('withdraw-token <uid>')
  .description('withdraw the specified ERC721 token via the Transfer Gateway')
  .option("-g, --gas <number>", "Gas for the tx")
  .option("--timeout <number>", "Number of seconds to wait for withdrawal to be processed")
  .action(async function(uid, options) {
    let client;
    try {
      const extdev = loadExtdevAccount();
      const rinkeby = loadRinkeyAccount();
      client = extdev.client;

      const networkId = await rinkeby.web3js.eth.net.getId();
      const signature = await depositTokenToExtdevGateway({
        client: extdev.client,
        web3js: extdev.web3js,
        tokenId: uid,
        ownerExtdevAddress: extdev.account,
        ownerRinkebyAddress: rinkeby.account.address,
        tokenExtdevAddress: ProvenanceDAppChainJSON.networks[extdevChainId].address,
        tokenRinkebyAddress: ProvenanceMainnetJSON.networks[networkId].address,
        timeout: options.timeout ? (options.timeout * 1000) : 120000
      });
      console.log(`Token ${uid} deposited to DAppChain Gateway...`);
      const tx = await withdrawTokenFromRinkebyGateway({
        web3js: rinkeby.web3js,
        tokenId: uid,
        accountAddress: rinkeby.account.address,
        signature,
        gas: options.gas || 350000
      });
      console.log(`Token ${uid} withdrawn from Ethereum Gateway.`);
      console.log(`Rinkeby tx hash: ${tx.transactionHash}`);
    } catch (err) {
      console.error(err);
    } finally {
      if (client) {
        client.disconnect();
      }
    }
  });

program
  .command('resume-withdrawal')
  .description('attempt to complete a pending withdrawal via the Transfer Gateway')
  .option("-g, --gas <number>", "Gas for the tx")
  .action(async function(options) {
    let client;
    try {
      const extdev = loadExtdevAccount();
      const rinkeby = loadRinkeyAccount();
      client = extdev.client;

      const networkId = await rinkeby.web3js.eth.net.getId();
      const myRinkebyCoinAddress = Address.fromString(`eth:${MyRinkebyCoinJSON.networks[networkId].address}`);
      const receipt = await getPendingWithdrawalReceipt(extdev.client, extdev.account);
      const signature = CryptoUtils.bytesToHexAddr(receipt.oracleSignature);
      
      if (receipt.tokenContract.toString() === myRinkebyCoinAddress.toString()) {
        const tx = await withdrawCoinFromRinkebyGateway({
          web3js: rinkeby.web3js,
          amount: receipt.tokenAmount,
          accountAddress: rinkeby.account.address,
          signature,
          gas: options.gas || 350000
        });
        console.log(`${receipt.tokenAmount.div(coinMultiplier).toString()} tokens withdrawn from Etheruem Gateway.`);
        console.log(`Rinkeby tx hash: ${tx.transactionHash}`);
      } else {
        const tx = await withdrawTokenFromRinkebyGateway({
          web3js: rinkeby.web3js,
          tokenId: receipt.tokenId,
          accountAddress: rinkeby.account.address,
          signature,
          gas: options.gas || 350000
        });
        console.log(`Token ${receipt.tokenId.toString()} withdrawn from Ethereum Gateway.`);
        console.log(`Rinkeby tx hash: ${tx.transactionHash}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (client) {
        client.disconnect();
      }
    }
  });

program
  .command('deposit-token <uid>')
  .description('deposit an ERC721 token into the Transfer Gateway')
  .option("-g, --gas <number>", "Gas for the tx")
  .action(async function(uid, options) {
    const { account, web3js } = loadRinkeyAccount();
    try {
      const tx = await depositTokenToGateway(web3js, uid, account.address, options.gas || 350000);
      console.log(`Token ${uid} deposited, Rinkeby tx hash: ${tx.transactionHash}`);
    } catch (err) {
      console.error(err);
    }
  });

program
  .command('mint-token <uid>')
  .description('mint an ERC721 token on Rinkeby')
  .option("-g, --gas <number>", "Gas for the tx")
  .action(async function(uid, options) {
    const { account, web3js } = loadRinkeyAccount();
    try {
      const tx = await mintToken(web3js, uid, account.address, options.gas || 350000);
      console.log(`Token ${uid} minted, Rinkeby tx hash: ${tx.transactionHash}`);
    } catch (err) {
      console.error(err);
    }
  });

program
  .command('token-balance')
  .description('display the current ERC721 token balance for an account')
  .option('-c, --chain <chain ID>', '"eth" for Rinkeby, "extdev" for PlasmaChain')
  .option('-a, --account <hex address>', 'Account address')
  .action(async function(options) {
    try {
      let ownerAddress, balance;
      if (options.chain === 'eth') {
        const { account, web3js } = loadRinkeyAccount();
        ownerAddress = account.address;
        if (options.account) {
          ownerAddress = (options.account === 'gateway') ? rinkebyGatewayAddress : options.account;
        }
        balance = await getRinkebyTokenBalance(web3js, ownerAddress);
      } else {
        const { account, web3js, client } = loadExtdevAccount();
        ownerAddress = account;
        if (options.account) {
          ownerAddress = (options.account === 'gateway') ? extdevGatewayAddress : options.account;
        }
        try {
          balance = await getExtdevTokenBalance(web3js, ownerAddress);
        } catch (err) {
          throw err;
        } finally {
          client.disconnect();
        }
      }
      console.log(`\n${ownerAddress} owns ${balance.total} tokens.\n`);
      if (balance.tokens.length > 0) {
        console.log(`First ${balance.tokens.length} token(s): ${balance.tokens}`);
      }
    } catch (err) {
      console.error(err);
    }
  });

program
  .command('map-contracts')
  .description('maps contracts')
  .action(async function(options) {
    let client;
    try {
      const rinkeby = loadRinkeyAccount();
      const extdev = loadExtdevAccount();
      client = extdev.client;
      const networkId = await rinkeby.web3js.eth.net.getId();

      let tokenRinkebyAddress, tokenExtdevAddress, rinkebyTxHash;

      tokenRinkebyAddress = ProvenanceMainnetJSON.networks[networkId].address;
      rinkebyTxHash = ProvenanceMainnetJSON.networks[networkId].transactionHash;
      tokenExtdevAddress = ProvenanceDAppChainJSON.networks[extdevChainId].address;

      const signer = new OfflineWeb3Signer(rinkeby.web3js, rinkeby.account);
      await mapContracts({
        client,
        signer,
        tokenRinkebyAddress,
        tokenExtdevAddress,
        ownerExtdevAddress: extdev.account,
        rinkebyTxHash
      });
      console.log(`Submitted request to map ${tokenExtdevAddress} to ${tokenRinkebyAddress}`);
    } catch (err) {
      console.error(err);
    } finally {
      if (client) {
        client.disconnect();
      }
    }
  });

program
  .command('map-accounts')
  .description('maps accounts')
  .action(async function() {
    let client;
    try {
      const rinkeby = loadRinkeyAccount();
      const extdev = loadExtdevAccount();
      client = extdev.client;

      const signer = new OfflineWeb3Signer(rinkeby.web3js, rinkeby.account);
      await mapAccounts({
        client,
        signer,
        ownerRinkebyAddress: rinkeby.account.address,
        ownerExtdevAddress: extdev.account
      });
    } catch (err) {
      console.error(err)
    } finally {
      if (client) {
        client.disconnect()
      }
    }
  });

program
  .version('0.1.0')
  .parse(process.argv);
