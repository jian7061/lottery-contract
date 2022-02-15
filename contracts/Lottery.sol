//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "contracts/Token.sol";
import "hardhat/console.sol";

contract Lottery {
    //whether a player enters the lottery for each round
    mapping(uint256 => mapping(address => bool)) public isEntered;
    //index of a player for each round
    mapping(uint256 => mapping(uint256 => address)) public indexOfPlayer;
    //the number of players for each round
    mapping(uint256 => uint256) public totalPlayers;
    //the address of a winner for each round
    mapping(uint256 => address) public winners;
    //total amount of prize for each round
    mapping(uint256 => uint256) public prizeAmount;
    //start time for each round
    mapping(uint256 => uint256) public startTime;
    //end time for each round
    mapping(uint256 => uint256) public endTime;
    uint256 public ticketPrice;
    uint256 public currentRound;
    address public admin;
    //Token Contract address
    address private token;
    //index of a player
    uint256 private index;
    uint256 private currentTime;

    event PlayerJoined(uint256 AllPlayers, address player, uint256 round, uint256 prizeAmount);
    event LotteryResult(uint256 round, uint256 prizeAmount);
    event MoveToNextRound(uint256 round, uint256 prizeAmount);
    event PrizeCollected(address winner, uint256 prizeAmount);

    constructor(address TokenAddr) {
        token = TokenAddr;
        admin = msg.sender;
        currentRound = 1;
        ticketPrice = 100;
        currentTime = block.timestamp;
        startTime[currentRound] = currentTime;
        endTime[currentRound] = currentTime + 1 days;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can execute");
        _;
    }

    function enterLottery() external {
        require(msg.sender != admin, "Admin is not allowed to enter game");
        require(block.timestamp >= startTime[currentRound] && block.timestamp < endTime[currentRound], "Time out");
        //pay ticket price as a player enters the game.
        IERC20(token).transferFrom(msg.sender, address(this), ticketPrice);
        //the player joins this round.
        isEntered[currentRound][msg.sender] = true;
        totalPlayers[currentRound]++;
        //the player acquires index.
        indexOfPlayer[currentRound][index] = msg.sender;
        //add ticket price to total prize amount.
        prizeAmount[currentRound] += ticketPrice;
        //increase index of a player
        index++;

        emit PlayerJoined(totalPlayers[currentRound], msg.sender, currentRound, prizeAmount[currentRound]);
    }

    function getRandomValue() internal view returns (uint256) {
        // Note that this number remains insecurely protected.
        // This number could be manipulated and results in grinding attack.
        return uint256(keccak256(abi.encodePacked(block.number, block.timestamp)));
    }

    function pickWinner() external onlyAdmin {
        // this round starts only if there are more than 3 players.
        if (totalPlayers[currentRound] >= 3) {
            //pick a winner with a random number.
            uint256 luckyNumber = getRandomValue() % totalPlayers[currentRound];
            address winner = indexOfPlayer[currentRound][luckyNumber];
            winners[currentRound] = address(winner);

            emit LotteryResult(currentRound, prizeAmount[currentRound]);

            // update variables
            currentRound++;
            index = 0;

            // reset total amount of prize
            prizeAmount[currentRound + 1] = 0;
        } else {
            //if there are less than 3 players, they should be passed to the next round.
            currentRound++;
            isEntered[currentRound][msg.sender] = true;
            totalPlayers[currentRound]++;
            indexOfPlayer[currentRound][index] = msg.sender;
            prizeAmount[currentRound] += ticketPrice;

            emit MoveToNextRound(currentRound, prizeAmount[currentRound]);

            // update variables
            prizeAmount[currentRound] += ticketPrice;
            index++;
        }
    }

    function collectPrize(uint256 round) external {
        // transfer prize to winner of the round
        IERC20(token).transfer(winners[round], prizeAmount[round]);

        emit PrizeCollected(winners[round], prizeAmount[round]);
    }
}
