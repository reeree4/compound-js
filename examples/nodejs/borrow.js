/** 
 * Example of supplying ETH to the Compound protocol with Compound.js
 *
 * Run ganache-cli in another command line window before running this script. Be
 *     sure to fork mainnet.

ganache-cli \
  -f https://mainnet.infura.io/v3/_YOUR_INFURA_ID_ \
  -m "clutch captain shoe salt awake harvest setup primary inmate ugly among become" \
  -i 1

  ganache-cli -g 0 --account 0x42fa44160d468f9ed88c59aff4bd17845c046f519aef9b9123027a4b1731afb9,100000000000000000000000000 --fork https://mainnet.infura.io/v3/<API-KEY> --unlock 0xa478c2975ab1ea89e8196811f51a7b7ade33eb11 --unlock 0x5bd87adb554702e535aa74431dda68eaf9a8f548 --unlock 0x5c8960c7f56878ae3769bf7145b0147f83bfdf58
 */

const Compound = require('../../dist/nodejs/index.js');
const ethers = require('ethers');

const ethUsdTestAddy = '0x5bd87adb554702e535aa74431dda68eaf9a8f548';
const uniEthTestAddy = '0x5c8960c7f56878ae3769bf7145b0147f83bfdf58'

const myAddress = '0xa0df350d2637096571F7A701CBc1C5fdE30dF76A';
const privateKey = '0xb8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329';

// new ethers.providers.JsonRpcProvider(
const provider = 'http://localhost:8545';
// const signer = provider.getSigner(testAddy);
const compound = new Compound(provider, {
  from: ethUsdTestAddy /*privateKey*/,
  networkId: 1,
  networkName: 'local_fork'
});

const compoundUniEth = new Compound(provider, {
  from: uniEthTestAddy,
  networkId: 1,
  networkName: 'local_fork'
});


const getUnderlyingBalance = (token, address) => {
  const lpAddress = Compound.util.getAddress(token);
  return Compound.eth.read(
    lpAddress,
    'function balanceOf(address) returns (uint256)',
    [ address ],
    { provider }
  );
};

(async function() {
  let myLpBalance = await getUnderlyingBalance(Compound.UniV2ETHUSDT, ethUsdTestAddy);
  console.log(`Test addy UniV2ETHUSDT balance: ${ (myLpBalance / 1e18).toString() }`);

  console.log('Supplying 0.01 UniV2ETHUSDT as ethUsdTestAddy...');
  const trx1 = await compound.supply(Compound.UniV2ETHUSDT, 0.01, false, { from: ethUsdTestAddy, gasLimit: '1000000' });

  console.log('Entering UniV2ETHUSDT market (use as collateral) as ethUsdTestAddy...');
  const trx2 = await compound.enterMarkets([Compound.UniV2ETHUSDT], { from: ethUsdTestAddy }); // also accepts []
  
  console.log('Supplying 0.01 UniV2UNIETH as uniEthTestAddy...');
  const trx3 = await compoundUniEth.supply(Compound.UniV2UNIETH, 0.01, false, { from: uniEthTestAddy, gasLimit: '1000000' });

  console.log('Entering UniV2UNIETH market (use as collateral) as uniEthTestAddy...');
  const trx4 = await compoundUniEth.enterMarkets([Compound.UniV2UNIETH], { from: uniEthTestAddy }); // also accepts []
  
  const borrowerUniEthBalanceBefore = await getUnderlyingBalance(Compound.UniV2UNIETH, ethUsdTestAddy);
  console.log(`ethUsdTestAddy's UniV2UNIETH Balance before borrowing: ${ (borrowerUniEthBalanceBefore / 1e18).toString() }`);

  // UniV2UNIETH
  console.log('Borrowing UniV2UNIETH against UniV2ETHUSDT as ethUsdTestAddy...');
  const trx5 = await compound.borrow(Compound.UniV2UNIETH, 0.1, { from: ethUsdTestAddy, gasLimit: 800000 });

  console.log('Borrow transaction receipt', await trx5.wait())

  const borrowerUniEthBalance = await getUnderlyingBalance(Compound.UniV2UNIETH, ethUsdTestAddy);
  console.log(`ethUsdTestAddy's UniV2UNIETH Balance after borrow: ${ (borrowerUniEthBalance / 1e18).toString() }`);

  // Exit a market (string argument of only 1 market at a time)
  // const trx = await compound.exitMarket(Compound.ETH);

})().catch(console.error);
