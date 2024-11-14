import {task} from "hardhat/config";
import * as zk from "zksync-ethers";
import {AAFactory__factory, ImplContract__factory, Paymaster__factory} from "../typechain-types";
import {ethers} from "ethers";
import {TransactionLike} from "zksync-ethers/src/types";
import {initLocalNode} from "./help/era-local-node";
const value = 2342353534;
task('deploy-impl')
    .setAction(async (_, hre) => {
        const implContract = await hre.deployer.deploy("ImplContract",
            [value],
            'create2', {customData: {salt: ethers.ZeroHash}},
        );

        await implContract.waitForDeployment();
        const implContractAddress = await implContract.getAddress();
        console.log(`implContract deployed to ${implContractAddress}`);

        if (hre.network.config.verifyURL) {
            await hre.run(`verify`, {
                address: implContractAddress,
                constructorArgsParams: [value]
            });
        }
    });
let implContractAddress = '0x3e88b587BD6414ba7Af691bd0aD9C981eD22A1Bb';

task('deploy-proxy')
    .setAction(async (_, hre) => {
        const proxyContract = await hre.deployer.deploy("ProxyContract",
            [implContractAddress],
            'create2', {customData: {salt: ethers.ZeroHash}},
        );

        await proxyContract.waitForDeployment();
        const proxyContractAddress = await proxyContract.getAddress();
        console.log(`proxyContract deployed to ${proxyContractAddress}`);

        if (hre.network.config.verifyURL) {
            await hre.run(`verify`, {
                address: proxyContractAddress,
                constructorArgsParams: [implContractAddress]
            });
        }
    });
let proxyContractAddress = '0x6e5142B8e14E9349E2E3df3967E3f6D041BD02D8';

task('test-proxy')
    .setAction(async (_, hre) => {
        await initLocalNode(hre, {log: false});
        await hre.run("deploy-impl");
        await hre.run("deploy-proxy");

        console.log(await ImplContract__factory.connect(implContractAddress, hre.zksyncEthers.providerL2).value());
        console.log(await ImplContract__factory.connect(proxyContractAddress, hre.zksyncEthers.providerL2).value());
    })

