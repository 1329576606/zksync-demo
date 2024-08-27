import {task} from "hardhat/config";
import * as zk from "zksync-ethers";
import {AAFactory__factory} from "../typechain-types";
import {Contract, ContractTransactionResponse, ethers} from "ethers";
import {TransactionLike} from "zksync-ethers/src/types";

task('deploy-account-factory')
    .setAction(async (_, hre) => {
        const accountArtifact = await hre.deployer.loadArtifact("Account");
        const hashBytecode = zk.utils.hashBytecode(accountArtifact.bytecode);
        const aaFactory = await hre.deployer.deploy("AAFactory",
            [hashBytecode],
            'create2', {customData: {salt: ethers.ZeroHash}},
            [accountArtifact.bytecode]
        );

        await aaFactory.waitForDeployment();
        const accountFactoryAddress = await aaFactory.getAddress();
        console.log(`AAFactory deployed to ${accountFactoryAddress}`);
        console.log(`npx hardhat verify ${accountFactoryAddress} ${ethers.hexlify(hashBytecode)}`);
    });
const aaFactoryAddress = '0x5563003F095f7F816185806681aAfA858Fb80da4';

//0x010005bbc6f94c52c58c2642acbd40ffb4c2f21a60f2820767aa7d5af6aaec00
task('get-account-factory-info')
    .setAction(async (_, hre) => {
        const wallet = await hre.zksyncEthers.getWallet(0);
        const aaFactory = AAFactory__factory.connect(aaFactoryAddress, wallet);
        console.log(await aaFactory.aaBytecodeHash());
    })

task('create-aa-by-eoa')
    .setAction(async (_, hre) => {
        const salt = hre.ethers.ZeroHash;
        const wallet = await hre.zksyncEthers.getWallet(0);
        const contract = new Contract(zk.utils.CONTRACT_DEPLOYER_ADDRESS, zk.utils.CONTRACT_DEPLOYER, wallet);
        const tx: ContractTransactionResponse = await contract.create2Account(salt, '0x0100060bb3c699d6b73a8ea414f1a5aa0181c433f0534e49fdf1cdfc278f1c56', hre.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [wallet.address]), 1);
        const receipt = await tx.wait();
        console.log(receipt)
    });

task('create-aa')
    .setAction(async (_, hre) => {
        const salt = hre.ethers.ZeroHash;
        const wallet = await hre.zksyncEthers.getWallet(0);
        const aaFactory = AAFactory__factory.connect(aaFactoryAddress, wallet);


        const tx = await aaFactory.deployAccount(salt, wallet.address);
        const receipt = await tx.wait();
        console.log(receipt);


        const aaAddress = await aaFactory.getAccountAddress(salt, wallet.address);
        console.log(`AA address: ${aaAddress}`)
    })
const aaWalletAddress = '0x695FF9f68F4688b6CFA043001851c5DCcBa851C4';

task('aa-send')
    .setAction(async (_, hre) => {
        const wallet = await hre.zksyncEthers.getWallet(0);
        const transactionGenerator = new hre.ethers.VoidSigner(aaWalletAddress, hre.zksyncEthers.providerL2);
        let transaction: TransactionLike = {
            from: aaWalletAddress,
            to: wallet.address,
            value: hre.ethers.parseEther('0.0000001'),
            type: 113,
            chainId: hre.network.config.chainId
        }

        const gasLimit = await hre.zksyncEthers.providerL2.estimateGas({
            ...transaction,
            from: aaWalletAddress,
        });
        const gasPrice = await hre.zksyncEthers.providerL2.getGasPrice();

        const serializedTx: TransactionLike = {
            ...transaction,
            gasLimit: gasLimit,
            gasPrice: gasPrice,
            nonce: await hre.zksyncEthers.providerL2.getTransactionCount(aaWalletAddress),
            from: aaWalletAddress, // Your smart contract wallet address goes here
            type: 113,
            customData: {
                gasPerPubdata: zk.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
            },
        };

        const signedTxHash = zk.EIP712Signer.getSignedDigest(serializedTx);
        serializedTx.customData!.customSignature = ethers.Signature.from(wallet.signingKey.sign(signedTxHash)).serialized;

        const tx = await hre.zksyncEthers.providerL2.broadcastTransaction(
            zk.types.Transaction.from(serializedTx).serialized,
        )
        const receipt = await tx.wait();
        console.log(receipt)
    })

