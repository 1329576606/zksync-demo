import {task} from "hardhat/config";
import * as zk from "zksync-ethers";
import {AAFactory__factory, Paymaster__factory} from "../typechain-types";
import {ethers} from "ethers";
import {TransactionLike} from "zksync-ethers/src/types";
import {initLocalNode} from "./help/era-local-node";

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

        if (hre.network.config.verifyURL) {
            await hre.run(`verify`, {
                address: accountFactoryAddress,
                constructorArgsParams: [ethers.hexlify(hashBytecode)]
            });
        }
    });
let aaFactoryAddress = '0x8A586a55420552796b2a3a09b5Ecf839FE976024';

task('create-aa')
    .setAction(async (_, hre) => {
        const salt = hre.ethers.ZeroHash;
        const wallet = await hre.zksyncEthers.getWallet(0);
        const aaFactory = AAFactory__factory.connect(aaFactoryAddress, wallet);


        const tx = await aaFactory.deployAccount(salt, wallet.address);
        const receipt = await tx.wait();
        // console.log(receipt);

        const aaAddress = await aaFactory.getAccountAddress(salt, wallet.address);
        console.log(`AA address: ${aaAddress}`)

        if (hre.network.config.verifyURL) {
            await hre.run(`verify`, {
                address: aaAddress,
                constructorArgsParams: [wallet.address]
            });
        }
    })
let aaWalletAddress = '0x0D8cf4BF494b867D3EE8B5Ef1744566A53D96CD9';

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
    });

task('deploy-paymaster')
    .setAction(async (_, hre) => {
        const wallet = await hre.zksyncEthers.getWallet(0);
        const paymaster = await hre.deployer.deploy('Paymaster', [wallet.address]
            , 'create2', {customData: {salt: ethers.ZeroHash}, value: hre.ethers.parseEther('0.01')}
        )
        await paymaster.waitForDeployment();
        console.log(`Paymaster deployed to : ${await paymaster.getAddress()}`);

        if (hre.network.config.verifyURL) {
            await hre.run(`verify`, {
                address: await paymaster.getAddress(),
                constructorArgsParams: [wallet.address]
            });
        }
    })
let paymasterAddress = '0xbEAC1A8EE1E8461aeF54960FDBaD8a34F5c59f0a';

task('paymaster-withdraw')
    .setAction(async (_, hre) => {
        const wallet = await hre.zksyncEthers.getWallet(0);
        const paymaster = Paymaster__factory.connect(paymasterAddress, wallet);
        const tx = await paymaster.withdraw();
        await tx.wait();
    })

task('aa-send-paymaster')
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

        let signedTxHash = zk.EIP712Signer.getSignedDigest(serializedTx);
        console.log(signedTxHash)
        serializedTx.customData!.paymasterParams = zk.utils.getPaymasterParams(paymasterAddress, {
            type: 'General',
            innerInput: ethers.Signature.from(wallet.signingKey.sign(signedTxHash)).serialized
        });

        signedTxHash = zk.EIP712Signer.getSignedDigest(serializedTx);
        console.log(signedTxHash)
        serializedTx.customData!.customSignature = ethers.Signature.from(wallet.signingKey.sign(signedTxHash)).serialized;

        const tx = await hre.zksyncEthers.providerL2.broadcastTransaction(
            zk.types.Transaction.from(serializedTx).serialized,
        )
        const receipt = await tx.wait();
        console.log(receipt)
    })

task('eoa-send-paymaster')
    .setAction(async (_, hre) => {
        const wallet = await hre.zksyncEthers.getWallet(0);
        const testEoaWallet = new zk.Wallet(process.env.LOCAL_NODE_PRIVATE_KEY as string, hre.zksyncEthers.providerL2, hre.zksyncEthers.providerL1);
        let transaction: TransactionLike = await testEoaWallet.populateTransaction({
            to: wallet.address,
            value: hre.ethers.parseEther('0.0000001'),
        })

        const serializedTx: TransactionLike = {
            ...transaction,
            type: 113,
            customData: {
                gasPerPubdata: zk.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
            },
        };

        let signedTxHash = zk.EIP712Signer.getSignedDigest(serializedTx);
        console.log(signedTxHash)
        serializedTx.customData!.paymasterParams = zk.utils.getPaymasterParams(paymasterAddress, {
            type: 'General',
            innerInput: ethers.Signature.from(wallet.signingKey.sign(signedTxHash)).serialized
        });

        signedTxHash = zk.EIP712Signer.getSignedDigest(serializedTx);
        console.log(signedTxHash)
        serializedTx.customData!.customSignature = ethers.Signature.from(testEoaWallet.signingKey.sign(signedTxHash)).serialized;

        const tx = await hre.zksyncEthers.providerL2.broadcastTransaction(
            zk.types.Transaction.from(serializedTx).serialized,
        )
        const receipt = await tx.wait();
        console.log(receipt)
    })

task('test-aa-paymaster')
    .setAction(async (_, hre) => {
        await initLocalNode(hre, {log: false});
        const localNodeWallet = new zk.Wallet(process.env.LOCAL_NODE_PRIVATE_KEY as string, hre.zksyncEthers.providerL2, hre.zksyncEthers.providerL1);
        const wallet = await hre.zksyncEthers.getWallet(0);
        const accountArtifact = await hre.deployer.loadArtifact("Account");
        const aaFactoryArtifact = await hre.deployer.loadArtifact("AAFactory");
        const paymasterArtifact = await hre.deployer.loadArtifact("Paymaster");
        aaFactoryAddress = zk.utils.create2Address(wallet.address, zk.utils.hashBytecode(aaFactoryArtifact.bytecode), ethers.ZeroHash, zk.utils.hashBytecode(accountArtifact.bytecode));
        aaWalletAddress = zk.utils.create2Address(aaFactoryAddress, zk.utils.hashBytecode(accountArtifact.bytecode), ethers.ZeroHash, ethers.AbiCoder.defaultAbiCoder().encode(['address'], [wallet.address]))
        paymasterAddress = zk.utils.create2Address(wallet.address, zk.utils.hashBytecode(paymasterArtifact.bytecode), ethers.ZeroHash, ethers.AbiCoder.defaultAbiCoder().encode(['address'], [wallet.address]));
        await (await localNodeWallet.sendTransaction({
            to: wallet.address,
            value: ethers.parseEther("100")
        })).wait();
        await hre.run("deploy-account-factory");
        await hre.run("create-aa");
        await (await localNodeWallet.sendTransaction({
            to: aaWalletAddress,
            value: ethers.parseEther("0.0000001")
        })).wait();
        await hre.run("deploy-paymaster");
        await hre.run('aa-send-paymaster')
    })

task('test-eoa-paymaster')
    .setAction(async (_, hre) => {
        await initLocalNode(hre, {log: false});
        const localNodeWallet = new zk.Wallet(process.env.LOCAL_NODE_PRIVATE_KEY as string, hre.zksyncEthers.providerL2, hre.zksyncEthers.providerL1);
        const wallet = await hre.zksyncEthers.getWallet(0);
        const paymasterArtifact = await hre.deployer.loadArtifact("Paymaster");
        paymasterAddress = zk.utils.create2Address(wallet.address, zk.utils.hashBytecode(paymasterArtifact.bytecode), ethers.ZeroHash, ethers.AbiCoder.defaultAbiCoder().encode(['address'], [wallet.address]));
        const testEoaWallet = new zk.Wallet(process.env.LOCAL_NODE_PRIVATE_KEY as string, hre.zksyncEthers.providerL2, hre.zksyncEthers.providerL1);

        await (await localNodeWallet.sendTransaction({
            to: testEoaWallet.address,
            value: ethers.parseEther("0.0000001")
        })).wait();
        await hre.run("deploy-paymaster");
        await hre.run('eoa-send-paymaster')
    })

