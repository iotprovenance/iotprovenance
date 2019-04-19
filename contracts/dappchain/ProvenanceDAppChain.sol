pragma solidity ^0.4.24;
import "../GenericProvenance.sol";
import "../Provenance.sol";

contract ProvenanceDAppChain is Provenance, GenericProvenance("ProvenanceToken", "PROV") {
    // DAppChain Gateway address
    address public gateway;

    constructor(address _gateway) public {
        gateway = _gateway;
    }

    // Used by the DAppChain Gateway to mint tokens that have been deposited to the Mainnet Gateway
    function mintToGateway(uint256 _uid) public {
        require(msg.sender == gateway);
        _mint(gateway, _uid);
    }

    function depositToGateway(address _gateway, uint _tokenId) public {
        require(false);
        // function not allowed on DAppChain contract
    }

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
        // function not allowed on DAppChain contract
        require(false);
        return _requestToken();
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
