const BN = require("bn.js");
const IERC20 = artifacts.require("IERC20");
const AaveFlashLoan = artifacts.require("AaveFlashloan");
const {USDC,aavePoolAddressesProvider,USDC_WHALE} = require("./config");


function sendEther(web3, from, to, amount) {
  return web3.eth.sendTransaction({
    from,
    to,
    value: web3.utils.toWei(amount.toString(), "ether"),
  });
}

contract("AaveFlashLoan", (accounts) => {
  const WHALE = USDC_WHALE
  const TOKEN_BORROW = USDC
  const DECIMALS = 6  // USDC uses 6 decimal places and not 18 like other ERC20
  // We fund more because we need to pay back along with the fees during Flash loan.
  // So let us fund extra (2 million round figure to the calculations simple)
  const FEE_AMOUNT = new BN(10).pow(new BN(DECIMALS)).mul(new BN(500)); // 1000100, 2 million USDC
  const BORROW_AMOUNT = new BN(10).pow(new BN(DECIMALS)).mul(new BN(1000000)); // 1 million USDC

  let aaveFlashLoanInstance
  let token

  beforeEach(async () => {
    token = await IERC20.at(TOKEN_BORROW) // USDC token
    aaveFlashLoanInstance = await AaveFlashLoan.new(aavePoolAddressesProvider)

    // send ether to USDC WHALE contract to cover tx fees
    await sendEther(web3, accounts[0], WHALE, 1)

    // send enough token to cover fee
    const bal = await token.balanceOf(WHALE)
    assert(bal.gte(FEE_AMOUNT), "balance < FEE")
    // Send USDC tokens to AaveFlashLoan contract
    await token.transfer(aaveFlashLoanInstance.address, FEE_AMOUNT, {
      from: WHALE,
    })

    const bal2 = await token.balanceOf(aaveFlashLoanInstance.address)
    console.log("balance of USDC in AaveFlashLoan contract:", bal2.toString())

  })
    it("aave simple flash loan", async () => {
        const tx = await aaveFlashLoanInstance.aaveFlashloan(token.address, BORROW_AMOUNT
          
          )
        console.log("token address:",token.address)
        for (const log of tx.logs) {
        console.log(log.args.message, log.args.val.toString())
        }
    })

});