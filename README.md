# Sticky NFT

A quick and dirty build 👷🛠️to attach one nft (sticky nft) to another (master NFT).

An NFT transferred to StickyNFT contract 📜, can only be withdrawn by the owner of the master NFT with the same id (the ERC721 instance set as master). A transfer of the master NFT implicitly includes a transfer of the sticky NFT (which can remain embedded in StickyNFT).

To prevent a seller from frontrunning a sale with a release/withdraw call, the withdrawal is ✂️ into two functions:

`function releaseNFT(uint id) external masterCalling(id)`

*Maps the stickyNFT id to the timestamp of the transaction. A cooldown 🧊is calculated against this value, during which the nft can't yet be withdrawn.*

`function withdrawNFT(uint id) external masterCalling(id)`

*The actual withdrawal; transferring out the Sticky NFT to the owner of the master nft.*

##

☠️⚡ EXPERIMENTAL, sparsely tested build; NOT FOR ACTUAL USE ‼️

##

## Who needs this? 

I own a few [AINightbirds](https://twitter.com/ainightbirds). After the launch an also AI generated ["art banner"](https://opensea.io/collection/artbannersbyai) 🤖🎨🖌️ was airdropped to each bird owner. It is a social media banner in the same style as the bird and it drastically enhances the pfp effect of the bird ❤️‍🔥

Currently the tokens cannot be sold as a set. Over time, more and more banners will wind up in a different wallet 👛 then their corresponding bird, with slim chances of reunion. I believe it is imperative for the long-term development of the project to promote keeping the tokens as a set 🖇️ by providing the community with the tools to do so. 

Hopefully the build shows that this can be done in a simple, gas friendly manner; transfer the banner once to a wrapper contract like stickyNFT and future set transfers only involve the transfer of the master nft (the bird in this case).






