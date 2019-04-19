pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Receiver.sol";

import "./ERC20Receiver.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./ValidatorManagerContract.sol";


contract Gateway is ERC721Receiver, ValidatorManagerContract {

    using SafeMath for uint256;

    struct Balance {
        uint256 eth;
        mapping(address => uint256) erc20;
        mapping(address => mapping(uint256 => bool)) erc721;
    }

    mapping (address => Balance) balances;

    event ERC721Received(address operator, address from, uint256 uid, address contractAddress);

    enum TokenKind {
        ETH,
        ERC20,
        ERC721
    }


    /**
     * Event to log the withdrawal of a token from the Gateway.
     * @param owner Address of the entity that made the withdrawal.
     * @param kind The type of token withdrawn (ERC20/ERC721/ETH).
     * @param contractAddress Address of token contract the token belong to.
     * @param value For ERC721 this is the uid of the token, for ETH/ERC20 this is the amount.
     */
    event TokenWithdrawn(address indexed owner, TokenKind kind, address contractAddress, uint256 value);

    constructor (address[] _validators, uint8 _threshold_num, uint8 _threshold_denom)
    public ValidatorManagerContract(_validators, _threshold_num, _threshold_denom) {
    }


    function depositERC721(address from, uint256 uid) private {
        balances[from].erc721[msg.sender][uid] = true;
    }

    function withdrawERC721(uint256 uid, bytes sig, address contractAddress)
    external
    isVerifiedByValidator(uid, contractAddress, sig)
    {
        require(balances[msg.sender].erc721[contractAddress][uid], "Does not own token");
        ERC721(contractAddress).safeTransferFrom(address(this),  msg.sender, uid);
        delete balances[msg.sender].erc721[contractAddress][uid];
        emit TokenWithdrawn(msg.sender, TokenKind.ERC721, contractAddress, uid);
    }

    function onERC721Received(address _operator, address _from, uint256 _uid, bytes)
    public
    returns (bytes4)
    {
        require(allowedTokens[msg.sender], "Not a valid token");
        depositERC721(_from, _uid);
        emit ERC721Received(_operator, _from, _uid, msg.sender);
        return ERC721_RECEIVED;
    }

    // Returns ERC721 token by uid
    function getNFT(address owner, uint256 uid, address contractAddress) external view returns (bool) {
        return balances[owner].erc721[contractAddress][uid];
    }
}
