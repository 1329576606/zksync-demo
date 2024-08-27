import {task} from "hardhat/config";
import {Create2Demo__factory, CreateDemo__factory, MockContract__factory} from "../typechain-types";
import {ethers} from "ethers";

// https://explorer.testnet.abs.xyz/tx/0xbad0854aec7796e5044acb9f38908793e739d0c87c8654a16d939f730abdfef2
// https://explorer.testnet.abs.xyz/tx/0xae28e29a3cd635987b38e0c626ee7ddac85e1ee9356c0daf6f6b2ecf68e2259b
task('deploy-lock')
    .setAction(async (args, hre) => {
        const contractName = "MyLock";
        const contract = await hre.deployer.deploy(contractName, [Math.ceil(new Date().getTime() / 1000) + 10]);
        console.log(await contract.getAddress())
    })

//0x7a63F77cd490A08c8B6654ae1bD8A1b71B9a9372
task('deploy-create-demo')
    .setAction(async (args, hre) => {
        const contractName = "CreateDemo";
        const contract = await hre.deployer.deploy(contractName);
        console.log(await contract.getAddress())
    })

task('create-demo-create')
    .setAction(async (args, hre) => {
        const contractAddress = '0x7a63F77cd490A08c8B6654ae1bD8A1b71B9a9372';
        const wallet = await hre.zksyncEthers.getWallet(0);
        var createDemo = CreateDemo__factory.connect(contractAddress, wallet);
        const contractTransactionResponse = await createDemo.create(1329576606);
        const receipt = await contractTransactionResponse.wait();
        console.log(receipt?.hash)
        const mockContractAddress = ethers.AbiCoder.defaultAbiCoder().decode(["address"], receipt!.logs.filter(log => log.address.toLowerCase() == contractAddress.toLowerCase())[0].topics[2])[0];
        console.log(mockContractAddress)
        const mockContract = MockContract__factory.connect(mockContractAddress, wallet);
        console.log(await mockContract.id())
    })

//0x24316801Fb94a919F141ebd96a0FC35312b987A5
task('deploy-create2-demo')
    .setAction(async (args, hre) => {
        const contractName = "Create2Demo";
        const contract = await hre.deployer.deploy(contractName);
        console.log(await contract.getAddress())
    })

task('create2-demo-create')
    .setAction(async (args, hre) => {
        const contractAddress = '0x24316801Fb94a919F141ebd96a0FC35312b987A5';
        const wallet = await hre.zksyncEthers.getWallet(0);
        var createDemo = Create2Demo__factory.connect(contractAddress, wallet);
        const id = 1329576606;
        console.log(await createDemo.computeAddress(id))
        const contractTransactionResponse = await createDemo.create(id);
        const receipt = await contractTransactionResponse.wait();
        console.log(receipt?.hash)
        const mockContractAddress = ethers.AbiCoder.defaultAbiCoder().decode(["address"], receipt!.logs.filter(log => log.address.toLowerCase() == contractAddress.toLowerCase())[0].topics[2])[0];
        console.log(mockContractAddress)
        const mockContract = MockContract__factory.connect(mockContractAddress, wallet);
        console.log(await mockContract.id())
    })