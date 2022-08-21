// SPDX-License-Identifier: MIT License
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @author daodreams.eth
/// @notice A highly experimental contract; don't drop value onto it!
/// @dev This contract facilitates keeping two individuals NFTs together as a set, with the sticky
/// only releasable by the owner of themaster NFT. Assuming identical Master and sticky ID (e.g. 
/// AINightBirds, ArtBannersByAI)
contract StickyNFT {
   
    IERC721 public master;
    IERC721 public sticky;

    uint coolDown = 20 minutes;

    mapping(uint => uint) public setForRelease;

    event Release(uint stickyId, address caller);
    event Cancelled(uint stickyId, address caller);
    event Withdrawn(uint stickyId, address caller);

    modifier masterCalling(uint id) {
        require(msg.sender == master.ownerOf(id), "Caller is not the owner of the MASTER NFT");
        _;
    }

    constructor (address _master, address _sticky) {
        master = IERC721(_master);
        sticky = IERC721(_sticky);
    }

    /// @dev releasing the sticky NFT is split in two functions (releaseNFT and withdrawNFT), 
    /// to prevent the seller from frontrunning a sale with a release transaction. 
    /// @param id of the sticky (and hence the master)
    function releaseNFT(uint id) external masterCalling(id) {
        require(address(this) == sticky.ownerOf(id), "StickyNFT not owned by this contract");
        require(setForRelease[id] == 0, "StickyNFT has already been set for release");
        setForRelease[id] = block.timestamp;
        emit Release(id, msg.sender);
    }

    /// @dev cancelling release procedure 
    function cancelRelease(uint id) external masterCalling(id) {
        setForRelease[id] = 0;
        emit Cancelled(id, msg.sender);
    }

    /// @dev if we are sticking to msg.sender no need to perform safeTransfer (already owns NFT)
    function withdrawNFT(uint id) external masterCalling(id) {
         uint releaseTS = setForRelease[id];
         require(releaseTS != uint(0), "StickyNFT has not been set for release");
         require (block.timestamp >= releaseTS + coolDown, "CoolDown hasn't passed");
         setForRelease[id] = 0;
         sticky.transferFrom(address(this), msg.sender, id);
         emit Withdrawn(id, msg.sender); 
    }

    function isSticky(uint id) external view returns (bool) {
        if(address(this) != sticky.ownerOf(id) || setForRelease[id] != 0) return false;
        return true;
    }
}