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

// This script generates a new BIP39 mnemonic and writes it out to a file in the parent directory,
// it also generates the a key from the mnemonic and writes that out to a file in the parent
// directory. The script expects 1-2 arguments, the first must specify the prefix to use for the
// generated files, the second argument may be used to specify the mnemonic to use instead of
// generating a new one.

const fs = require('fs');
const path = require('path');
const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');

const prefix = process.argv[2];

if (!prefix) {
  throw new Error('prefix not specified');
}

let mnemonic = process.argv[3];

if (mnemonic) {
  console.log('using mnemonic: ' + mnemonic);
} else {
  mnemonic = bip39.generateMnemonic();
}

const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
const wallet_hdpath = "m/44'/60'/0'/0/";

const wallet = hdwallet.derivePath(wallet_hdpath + '0').getWallet();

fs.writeFileSync(path.join(__dirname, `../${prefix}_account`), '0x' + wallet.getAddress().toString('hex'));
fs.writeFileSync(path.join(__dirname, `../${prefix}_mnemonic`), mnemonic);
fs.writeFileSync(path.join(__dirname, `../${prefix}_private_key`), wallet.getPrivateKey().toString('hex'));