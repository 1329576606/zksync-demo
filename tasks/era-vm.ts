import {task} from "hardhat/config";
import {initLocalNode} from "./help/era-local-node";
import {StorageDemo} from "../typechain-types";

task("test_getSlotAt")
    .setAction(async (_, hre) => {
        await initLocalNode(hre, {log: false});
        const storageDemo = await hre.deployer.deploy("StorageDemo", undefined, "create2", {
            customData: {
                salt: hre.ethers.ZeroHash
            }
        }).then(contract => contract.waitForDeployment())
            .then(contract => contract as any as StorageDemo);

        console.log(await hre.zksyncEthers.providerL2.send("eth_getStorageAt", [await storageDemo.getAddress(), "0x0", "latest"]));
        await storageDemo.setSlot0(1);
        console.log(await hre.zksyncEthers.providerL2.send("eth_getStorageAt", [await storageDemo.getAddress(), "0x0", "latest"]));

        console.log(await hre.zksyncEthers.providerL2.send("eth_getStorageAt", [await storageDemo.getAddress(), "0x1", "latest"]));
        await storageDemo.setSlot1(2);
        console.log(await hre.zksyncEthers.providerL2.send("eth_getStorageAt", [await storageDemo.getAddress(), "0x1", "latest"]));

        console.log(await hre.zksyncEthers.providerL2.send("eth_getStorageAt", [await storageDemo.getAddress(), "0x2", "latest"]));
        await storageDemo.setSlot2(3);
        console.log(await hre.zksyncEthers.providerL2.send("eth_getStorageAt", [await storageDemo.getAddress(), "0x2", "latest"]));
    });