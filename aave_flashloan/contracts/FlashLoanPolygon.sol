// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";

contract AaveFlashloan is FlashLoanSimpleReceiverBase {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    event Log(string message, uint256 val);

    constructor(IPoolAddressesProvider provider)
        FlashLoanSimpleReceiverBase(provider)
    {}

    function aaveFlashloan(address loanToken, uint256 loanAmount) external {
        IPool(address(POOL)).flashLoanSimple(
            address(this),
            loanToken,
            loanAmount,
            "0x",
            0
        );
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address, // initiator
        bytes memory
    ) public override returns (bool) {
        require(
            amount <= IERC20(asset).balanceOf(address(this)),
            "Invalid balance for the contract"
        );
        // pay back the loan amount and the premium (flashloan fee)
        uint256 amountToReturn = amount.add(premium);
        require(
            IERC20(asset).balanceOf(address(this)) >= amountToReturn,
            "Not enough amount to return loan"
        );

        approvetoken(asset, address(POOL), amountToReturn);
        emit Log("borrowed amount", amount);
        emit Log("flashloan fee", premium);
        emit Log("amountToReturn", amountToReturn);

        return true;
    }

    // we must approve asset such as USDC, USDT, DAI etc to be used by the pool contract
    function approvetoken(
       address token,
       address to,
       uint256 amountIn
    ) internal {
       require(IERC20(token).approve(to , amountIn),"approve failed");
    }
}