pragma solidity ^0.4.24;
import "../GenericProvenance.sol";
import "../Provenance.sol";

contract ProvenanceMainnet is Provenance, GenericProvenance("ProvenanceToken", "PROV")  {

    function createProvenance(uint _tokenId, string _context, uint[] _inputProvenanceIds) public returns (uint index) {
        return _createProvenance(_tokenId, _context, _inputProvenanceIds);
    }

    function updateProvenance(uint _provId, uint _tokenId, string _context, uint[] _inputProvenanceIds) public returns (bool success) {
        return _updateProvenance(_provId, _tokenId, _context, _inputProvenanceIds);
    }

    function deleteProvenance(uint _provId) public returns (bool success) {
        return _deleteProvenance(_provId);
    }

    function requestToken() public returns (uint tokenId) {
        return _requestToken();
    }

    function depositToGateway(address _gateway, uint _tokenId) public {
        safeTransferFrom(msg.sender, _gateway, _tokenId);
    }

    function mintToGateway(uint256 _uid) public {
        // function not allowed on Mainnet contract
        require(false);
    }

    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes _data
    ) public returns(bytes4) {
        return ERC721_RECEIVED;
    }

}

