# ZKSyncEVM（一切皆合约）

## 0. 目录

<!-- TOC -->
* [ZKSyncEVM（一切皆合约）](#zksyncevm一切皆合约)
  * [0. 目录](#0-目录)
  * [1. 概述](#1-概述)
  * [2. 系统合约](#2-系统合约)
  * [3. 账户模型](#3-账户模型)
  * [4.操作码差异](#4操作码差异)
  * [5. 合约部署](#5-合约部署)
  * [6.开发环境](#6开发环境)
<!-- TOC -->

## 1. 概述

ZKSyncEVM与EVM的区别：
1. 账户模型不同：在ZKSyncEVM中，只存储了合约的槽位信息。而且所有账户都是合约账户。
2. 操作码不兼容：在ZKSyncEVM中没有create、create2等操作码，但是在编译时会替换成调用系统合约。
3. 合约部署：在合约部署方式不同。
4. 系统合约：系统合约用来处理一些业务，如转账、部署合约等。

## 2. 系统合约

在ZkSyncEvm中，有一部分合约在在创世之初就已预先部署,这些合约被称为[系统合约](https://docs.zksync.io/build/developer-reference/era-contracts/system-contracts)。

由于在ZkSyncEvm中的账户模型和普通EVM不同，并且有一部分不支持的操作码，所以这一部分功能由系统合约完成。
包括合约部署、原生Token、合约字节码存储、immutable变量存储等功能。

[系统合约地址](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/Constants.sol)

## 3. 账户模型

|      | EVM                 | ZKSync EVM |
|------|---------------------|------------|
| 账户类型 | EOA+合约账户            | 只有合约账户     |
| 账户存储 | nonce、value、code、槽位 | 槽位         |

在ZkSync中，账户的存储数据与EVM不同，ZKSync中账户的存储数据只storage数据。 引出如下的几个问题：

1. 账户中不存储value如何转移以太币的？
    * 账户中不存储value。账户的余额及转账操作由[L2BaseToken](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/L2BaseToken.sol)和[MsgValueSimulator](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/MsgValueSimulator.sol)系统合约完成。
2. 账户中不存储code，如何执行合约？
    * [AccountCodeStorage](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/AccountCodeStorage.sol)系统合约存储着账户的 bytecodeHash。
    * [KnownCodeStorage](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/KnownCodesStorage.sol)系统合约中存储着合约的 bytecodeHash是否已知。
    * 真正的合约字节码会在[Compressor](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/Compressor.sol)系统合约发送到L1。
3. immutable变量存储在合约字节码中，但是ZkSyncEVM中并未存储字节码，是如何存储的。
    * immutable变量由[ImmutableSimulator](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/ImmutableSimulator.sol)系统合约实现。
4. nonce如何存储？
    * nonce存储在[NonceHolder](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/NonceHolder.sol)系统合约中。
5. ZkSyncEVM中只有合约账户，是如何使用私钥发送交易的？
    * 在ZkSyncEVM中，如果发现一个地址的bytecodeHash是空的，则为该账户的字节码是[DefaultAccount](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/DefaultAccount.sol)系统合约，改合约模拟了EOA的行为。
6. ZKSync中是否存在空合约？
    * 在ZkSync中有一个[EmptyContract](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/EmptyContract.sol)系统合约，在这个合约中什么都不会执行。

## 4. 操作码差异

https://docs.zksync.io/build/developer-reference/ethereum-differences/evm-instructions

由于操作码的差异，在开发中需要注意如下事项 ：
1. 不能使用openzeppelin的Create2。改为调用系统合约。
2. 不支持address.transfer，只能使用call或者send。

## 5. 合约部署

https://docs.zksync.io/build/developer-reference/ethereum-differences/contract-deployment

## 6. 开发环境
* [hardhat](https://docs.zksync.io/build/tooling/hardhat/getting-started)
* [foundry](https://docs.zksync.io/build/tooling/foundry/overview)
