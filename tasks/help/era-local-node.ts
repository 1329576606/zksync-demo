import {spawn} from "child_process";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import * as zk from "zksync-ethers";
import {ethers} from "ethers";

export async function initLocalNode(hre: HardhatRuntimeEnvironment, config: { log?: boolean } = {log: true}) {
    let service = spawn('./era_test_node');
    let isReady = false;
    service.stdout.on('data', (data) => {
        const message: string = data.toString();
        if (!isReady && message.match("Node is ready")) {
            isReady = true;
        }
        if (config.log) {
            console.log(message);
        }
    });
    service.stderr.on('data', (data) => {
        if (config.log) {
            console.error(`stderr: ${data}`);
        }
    });
    process.on('exit', () => {
        service.kill();
    });

    while (!isReady) {
        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 100)
        })
    }


    const localNodeWallet = new zk.Wallet(process.env.LOCAL_NODE_PRIVATE_KEY as string, hre.zksyncEthers.providerL2, hre.zksyncEthers.providerL1);
    const wallet = await hre.zksyncEthers.getWallet(0);
    await (await localNodeWallet.sendTransaction({
        to: wallet.address,
        value: ethers.parseEther("100")
    })).wait();
}