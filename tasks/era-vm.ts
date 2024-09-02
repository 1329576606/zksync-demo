import {task} from "hardhat/config";
import {initLocalNode} from "./help/era-local-node";
import {StorageDemo, VmDemo} from "../typechain-types";
import {EthersStateManager} from '@ethereumjs/statemanager';
import {Account, Address, hexToBytes} from '@ethereumjs/util';
import { LegacyTransaction } from '@ethereumjs/tx';
import { Block as EBlock } from '@ethereumjs/block';
import {VM} from "@ethereumjs/vm";
import {ethers} from "ethers";
const UINT64_MAX = BigInt('0xffffffffffffffff');

task("test-getSlotAt")
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
        console.log(await hre.zksyncEthers.providerL2.send("eth_getCode", [await storageDemo.getAddress()]));
    });

task('test-fork-vm')
    .setAction(async (_,hre)=>{
        await initLocalNode(hre, {log: false});
        const vmDemo = await hre.deployer.deploy("VmDemo", undefined, "create2", {
            customData: {
                salt: hre.ethers.ZeroHash
            }
        }).then(contract => contract.waitForDeployment())
            .then(contract => contract as any as VmDemo);
        await vmDemo.setSlot0(1);

        const stateManager = new MixedStateManager(new MyProvider('http://127.0.0.1:8011'));
        const vm = await VM.create({ stateManager });
        let block: ethers.Block =await hre.zksyncEthers.providerL2.getBlock('latest');
        (vm.stateManager as MixedStateManager).setBlockTag(BigInt(block.number));

        const tx = LegacyTransaction.fromTxData(
            {
                gasLimit: UINT64_MAX,
                gasPrice: UINT64_MAX,
                data: new Uint8Array(Buffer.from(vmDemo.interface.encodeFunctionData("getSlot0").replace('0x', ''), 'hex')),
                value: BigInt(0),
                to: new Address(hexToBytes(await vmDemo.getAddress())),
            },
            { freeze: false }
        );
        tx.getSenderAddress = () => {
            return new Address(
                hexToBytes('0x274D4461CD6e0f5CdBE5e422175c06Da3b1C1d19')
            );
        };

        const runTxResult = await vm.runTx({
            block: EBlock.fromRPC(block as any, undefined, {
                skipConsensusFormatValidation: true,
            }),
            tx: tx,
            skipNonce: true,
            skipBalance: true,
            skipBlockGasLimitValidation: true,
            skipHardForkValidation: true,
        });
        console.log(runTxResult)
    })

class MyProvider extends ethers.JsonRpcProvider {
    async send(method: string, params: Array<any> | Record<string, any>): Promise<any> {
        const res = await super.send(method, params);
        console.log(method, params, res)
        return res;
    }
}

class MixedStateManager extends EthersStateManager {
    slots: Record<string, string> = {};

    constructor(provider: ethers.JsonRpcProvider) {
        super({provider: provider, blockTag: 0n});
    }

    setSlots(slots: Record<string, string>) {
        this.slots = slots;
    }

    async getContractStorage(address: Address, key: Uint8Array) {
        const stateValue = this.slots[ethers.hexlify(key)];
        if (stateValue) {
            return hexToBytes(stateValue);
        } else {
            return super.getContractStorage(address, key);
        }
    }

    async getAccountFromProvider(address: Address) {
        return new Account();
    }

    shallowCopy() {
        return new MixedStateManager(this._provider);
    }
}