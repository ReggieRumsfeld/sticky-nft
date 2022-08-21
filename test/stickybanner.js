const { assert, expect } = require("chai")
const { hre, network } = require("hardhat");

describe("Testing StickyNFT", function () {
    let master;
    let slave;
    let accounts;
    let sticky;
    let timeStampBytes32;
    let mapLocation;
    
    before(async function () {
        accounts = await ethers.getSigners()
        const NFT = await ethers.getContractFactory("NonFung");
        master = await NFT.deploy("Master", "MST");
        await master.deployed();
        console.log("Master Address: ", master.address);
        slave = await NFT.deploy("Slave", "SLV");
        await slave.deployed();
        console.log("Slave deployed: ", slave.address);
        const Sticky = await ethers.getContractFactory("StickyNFT");
        sticky = await Sticky.deploy(master.address, slave.address);
        await sticky.deployed();
        for (let i = 0; i < 10; i++) {
            await master.mint(accounts[0].address, i);
            await slave.mint(accounts[1].address, i);
        }
        assert.equal(await slave.ownerOf(9), accounts[1].address);
    })

    describe('transfer asset into', function () {

        it("Transfers slave asset to Sticky, slave asset is sticky", async function () {
            await slave
            .connect(accounts[1])
            .transferFrom(accounts[1].address, sticky.address, 9);
            assert(await sticky.isSticky(9), "Should be sticky");
            assert.equal(await slave.ownerOf(9), sticky.address, "Sticky should be owner");
        });
        
        it("Cannot withdrawNFT without release being set", async function () {
            await expect(sticky.withdrawNFT(9)).to.be.revertedWith(
                "StickyNFT has not been set for release"
            );
        });
    })
    describe("releaseNFT", function () {
        let timeStamp;

        it("Can't call release on unowned", async function () {
            await expect(sticky.releaseNFT(7)).to.be.revertedWith(
                "StickyNFT not owned by this contract"
            );           
        })
        
        it("Sticky Asset can only be released by owner of master", async function () {
            assert.equal(
            await sticky.setForRelease(9),
            0,
            "Release should not be set"
            );
            await expect(
            sticky.connect(accounts[1]).releaseNFT(9)
            ).to.be.revertedWith("Caller is not the owner of the MASTER NFT");
            await expect(sticky.releaseNFT(9)).to.emit(sticky, "Release").withArgs(9, accounts[0].address);         
        });

        it("sets release with correct timestamp", async function () {
            timeStamp = (await slave.provider.getBlock()).timestamp;
            assert(
                (await sticky.setForRelease(9)).eq(timeStamp),
                "Timestamp issues"
            );
            mapLocation = ethers.utils.solidityKeccak256(
              ["uint", "uint"],
              [9, 3]
            );
            timeStampBytes32 = await network.provider.send("eth_getStorageAt", [
                sticky.address,
                mapLocation,
                "latest"
            ])
        })

        it("Can't call releaseNFT a second time", async function () {
            await expect(sticky.releaseNFT(9)).to.be.revertedWith(
              "StickyNFT has already been set for release"
            );
        })

        it("Asset fails isSticky check", async function () {
            expect(await sticky.isSticky(9)).to.be.false;
        })
    })

    describe("withdrawNFT during cooldown", function () {

        it("Cannot withdrawNFT during cooldown", async function () {
            await expect(sticky.withdrawNFT(9)).to.be.revertedWith("CoolDown hasn't passed")
        })

    })

    describe("Cancel release", function () {

        it("Cancels release", async function () {
            await expect(sticky.cancelRelease(9)).to.emit(sticky, "Cancelled").withArgs(9, accounts[0].address);
            assert((await sticky.setForRelease(9)).eq(0), "Mapping should be reset to 0");
            assert(await sticky.isSticky(9), "Should be sticky")
        })

        it("Cannot withdrawNFT after release has been cancelled", async function () {
            await expect(sticky.withdrawNFT(9)).to.be.revertedWith(
                "StickyNFT has not been set for release"
            );
        })
    })

    describe("moving beyond coolDown & claiming NFT", function () {
        before(async function () {
            await network.provider.send("evm_increaseTime", [1200]);
            await network.provider.send("evm_mine");
            await network.provider.send("hardhat_setStorageAt", [
                sticky.address,
                mapLocation,
                timeStampBytes32
            ])
        })

        it("Another then master owner cannot call", async function () {
            await expect(sticky.connect(accounts[1]).withdrawNFT(9)).to.be.revertedWith(
              "Caller is not the owner of the MASTER NFT"
            );
              await expect(sticky.connect(accounts[3]).withdrawNFT(9)).to.be.revertedWith(
                "Caller is not the owner of the MASTER NFT"
              );
        })

        it("Master owner transfer slave", async function () {
            await expect(sticky.withdrawNFT(9)).to.emit(sticky, "Withdrawn").withArgs(9, accounts[0].address);
            assert.equal(await slave.ownerOf(9), accounts[0].address, "Accounts 0 should be owner")
        })
    })
})