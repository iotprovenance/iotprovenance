pragma solidity ^0.4.24;

import "../../contracts/GenericProvenance.sol";
import "../../contracts/Provenance.sol";

contract ProvenanceMock is Provenance, GenericProvenance("ProvenanceToken", "PROV") {

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

    function mintToGateway(uint256 _uid) public {}
    function depositToGateway(address _gateway, uint _tokenId) public {}

    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes _data
    ) public returns(bytes4) {
        return ERC721_RECEIVED;
    }

}
