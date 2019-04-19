pragma solidity ^0.4.24;

import "../../contracts/ProvenanceStorage.sol";
import "../../contracts/ProvenanceCore.sol";

/**
 * @title ProvenanceStorageMock
 * This mock just provides public create/retrieve/update/delete functions for testing purposes.
 */
contract ProvenanceStorageMock is ProvenanceCore, ProvenanceStorage {

    function createProvenanceMock(uint _provId, uint _tokenId, uint[] _inputProvenanceIds, string _context) public returns (uint index) {
        return _createProvenance(_provId, _tokenId, _inputProvenanceIds, _context);
    }

    function updateProvenanceMock(uint _provId, uint _tokenId, uint[] _inputProvenanceIds, string _context) public returns (bool success) {
        return _updateProvenance(_provId, _tokenId, _inputProvenanceIds, _context);
    }

    function deleteProvenance(uint _provId) public returns (bool success) {
        return _deleteProvenance(_provId);
    }

    // Functions required by interface Provenance
    function createProvenance(uint _tokenId, string _context, uint[] _inputProvenanceIds) public returns (uint index) {require(false);}
    function updateProvenance(uint _provId, uint _tokenId, string _context, uint[] _inputProvenanceIds) public returns (bool success) {require(false);}
    function requestToken() public returns (uint tokenId) {require(false);}
    function numberOfProvenanceRecordsFor(uint _tokenId) public view returns (uint256) {require(false);}
    function provenanceOfTokenByIndex(uint _tokenId, uint _index) public view returns (uint provId) {require(false);}
    function mintToGateway(uint256 _uid) public {require(false);}
    function depositToGateway(address _gateway, uint _tokenId) public {require(false);}


}