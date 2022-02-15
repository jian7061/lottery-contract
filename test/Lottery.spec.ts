import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, Signer, BigNumber } from 'ethers';

describe('Lottery', () => {
  let Token: Contract;
  let Lottery: Contract;

  let wallet: Signer;
  let wallet2: Signer;
  let wallet3: Signer;
  let wallet4: Signer;

  let walletAddress: string;
  let wallet2Address: string;
  let wallet3Address: string;
  let wallet4Address: string;

  const tokenName = 'MyToken';
  const tokenSymbol = 'MT';
  const tokenDecimals = BigNumber.from('18');
  const initialToken = BigNumber.from('100000000000000000000');

  //get current time
  async function latestTimestamp(): Promise<number> {
    return (await ethers.provider.getBlock('latest')).timestamp;
  }

  describe('#enterLottery', () => {
    it('should return success if a player enters the lottery within a day', async () => {
      const accounts = await ethers.getSigners();
      [wallet, wallet2, wallet3, wallet4] = accounts;
      wallet2Address = await wallet2.getAddress();
      wallet3Address = await wallet3.getAddress();
      wallet4Address = await wallet4.getAddress();

      Token = await (
        await ethers.getContractFactory('contracts/Token.sol:Token', wallet)
      ).deploy(tokenName, tokenSymbol, tokenDecimals);

      Lottery = await (await ethers.getContractFactory('contracts/Lottery.sol:Lottery', wallet)).deploy(Token.address);

      await Token.mint(initialToken);
      await Token.mintTo(wallet2Address, initialToken);
      await Token.mintTo(wallet3Address, initialToken);
      await Token.mintTo(wallet4Address, initialToken);
      //should approve Lottery contract before join the round.
      await Token.approve(Lottery.address, initialToken);

      //3 players join the round.
      await expect(Lottery.connect(wallet2).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(1, wallet2Address, 1, 100);
      await expect(Lottery.connect(wallet3).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(2, wallet3Address, 1, 200);
      await expect(Lottery.connect(wallet4).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(3, wallet4Address, 1, 300);
    });

    it('should return revert if a player enters the lottery after the game has ended', async () => {
      const accounts = await ethers.getSigners();
      [wallet, wallet2, wallet3, wallet4] = accounts;
      wallet2Address = await wallet2.getAddress();
      wallet3Address = await wallet3.getAddress();
      wallet4Address = await wallet4.getAddress();

      Token = await (
        await ethers.getContractFactory('contracts/Token.sol:Token', wallet)
      ).deploy(tokenName, tokenSymbol, tokenDecimals);

      Lottery = await (await ethers.getContractFactory('contracts/Lottery.sol:Lottery', wallet)).deploy(Token.address);

      await Token.mint(initialToken);
      await Token.mintTo(wallet2Address, initialToken);
      await Token.mintTo(wallet3Address, initialToken);
      await Token.mintTo(wallet4Address, initialToken);
      //should approve Lottery contract before join the round.
      await Token.approve(Lottery.address, initialToken);

      let now = await latestTimestamp();
      const after1Sec = now + 1;
      const day = 60 * 60 * 24;
      const nextDay = after1Sec + day;

      //One day has passed.
      await ethers.provider.send('evm_setNextBlockTimestamp', [nextDay]);
      //3 players join the round after the game has ended.
      await expect(Lottery.connect(wallet2).enterLottery()).revertedWith('Time out');
    });

    it('should return revert if admin is trying to join the game', async () => {
      const accounts = await ethers.getSigners();
      [wallet] = accounts;
      walletAddress = await wallet.getAddress();
      Token = await (
        await ethers.getContractFactory('contracts/Token.sol:Token', wallet)
      ).deploy(tokenName, tokenSymbol, tokenDecimals);
      Lottery = await (await ethers.getContractFactory('contracts/Lottery.sol:Lottery', wallet)).deploy(Token.address);

      await Token.mint(initialToken);
      //should approve Lottery contract before join the round.
      await Token.approve(Lottery.address, initialToken);

      //should return revert if admin entered the game
      await expect(Lottery.enterLottery()).revertedWith('Admin is not allowed to enter game');
    });
  });

  describe('#pickWinner', () => {
    it('should return success with more than 3 players and msg.sender is the admin', async () => {
      const accounts = await ethers.getSigners();
      [wallet, wallet2, wallet3, wallet4] = accounts;
      wallet2Address = await wallet2.getAddress();
      wallet3Address = await wallet3.getAddress();
      wallet4Address = await wallet4.getAddress();

      Token = await (
        await ethers.getContractFactory('contracts/Token.sol:Token', wallet)
      ).deploy(tokenName, tokenSymbol, tokenDecimals);

      Lottery = await (await ethers.getContractFactory('contracts/Lottery.sol:Lottery', wallet)).deploy(Token.address);

      await Token.mint(initialToken);
      await Token.mintTo(wallet2Address, initialToken);
      await Token.mintTo(wallet3Address, initialToken);
      await Token.mintTo(wallet4Address, initialToken);
      //should approve Lottery contract before join the round.
      await Token.approve(Lottery.address, initialToken);

      //3 players join the round.
      await expect(Lottery.connect(wallet2).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(1, wallet2Address, 1, 100);
      await expect(Lottery.connect(wallet3).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(2, wallet3Address, 1, 200);
      await expect(Lottery.connect(wallet4).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(3, wallet4Address, 1, 300);
      //Only admin can pick a winner.
      await expect(Lottery.pickWinner()).to.emit(Lottery, 'LotteryResult').withArgs(1, 300);
    });

    it('should return revert with more than 3 players unless msg.sender is the admin', async () => {
      const accounts = await ethers.getSigners();
      [wallet, wallet2, wallet3, wallet4] = accounts;
      wallet2Address = await wallet2.getAddress();
      wallet3Address = await wallet3.getAddress();
      wallet4Address = await wallet4.getAddress();

      Token = await (
        await ethers.getContractFactory('contracts/Token.sol:Token', wallet)
      ).deploy(tokenName, tokenSymbol, tokenDecimals);

      Lottery = await (await ethers.getContractFactory('contracts/Lottery.sol:Lottery', wallet)).deploy(Token.address);

      await Token.mint(initialToken);
      await Token.mintTo(wallet2Address, initialToken);
      await Token.mintTo(wallet3Address, initialToken);
      await Token.mintTo(wallet4Address, initialToken);
      //should approve Lottery contract before join the round.
      await Token.approve(Lottery.address, initialToken);

      //3 players join the round.
      await expect(Lottery.connect(wallet2).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(1, wallet2Address, 1, 100);
      await expect(Lottery.connect(wallet3).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(2, wallet3Address, 1, 200);
      await expect(Lottery.connect(wallet4).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(3, wallet4Address, 1, 300);
      //Only admin can pick a winner.
      await expect(Lottery.connect(wallet2).pickWinner()).revertedWith('Only admin can execute');
    });

    it('should start game with next round if there are less than 3 players', async () => {
      const accounts = await ethers.getSigners();
      [wallet, wallet2] = accounts;
      wallet2Address = await wallet2.getAddress();

      Token = await (
        await ethers.getContractFactory('contracts/Token.sol:Token', wallet)
      ).deploy(tokenName, tokenSymbol, tokenDecimals);

      Lottery = await (await ethers.getContractFactory('contracts/Lottery.sol:Lottery', wallet)).deploy(Token.address);

      await Token.mint(initialToken);
      await Token.mintTo(wallet2Address, initialToken);
      await Token.mintTo(wallet3Address, initialToken);
      await Token.mintTo(wallet4Address, initialToken);
      //should approve Lottery contract before join the round.
      await Token.approve(Lottery.address, initialToken);

      //Only 2 players join the round.
      await expect(Lottery.connect(wallet2).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(1, wallet2Address, 1, 100);
      await expect(Lottery.connect(wallet3).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(2, wallet3Address, 1, 200);
      //If there are less than 3 players, they should be passed to the next round.
      await expect(Lottery.pickWinner()).to.emit(Lottery, 'MoveToNextRound').withArgs(2, 100);
    });
  });

  describe('#collectPrize', () => {
    it('should return success with more than 3 players and msg.sender is the admin', async () => {
      const accounts = await ethers.getSigners();
      [wallet, wallet2, wallet3, wallet4] = accounts;
      wallet2Address = await wallet2.getAddress();
      wallet3Address = await wallet3.getAddress();
      wallet4Address = await wallet4.getAddress();

      Token = await (
        await ethers.getContractFactory('contracts/Token.sol:Token', wallet)
      ).deploy(tokenName, tokenSymbol, tokenDecimals);

      Lottery = await (await ethers.getContractFactory('contracts/Lottery.sol:Lottery', wallet)).deploy(Token.address);

      await Token.mint(initialToken);
      await Token.mintTo(wallet2Address, initialToken);
      await Token.mintTo(wallet3Address, initialToken);
      await Token.mintTo(wallet4Address, initialToken);
      //should approve Lottery contract before join the round.
      await Token.approve(Lottery.address, initialToken);

      //3 players join the round.
      await expect(Lottery.connect(wallet2).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(1, wallet2Address, 1, 100);
      await expect(Lottery.connect(wallet3).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(2, wallet3Address, 1, 200);
      await expect(Lottery.connect(wallet4).enterLottery())
        .to.emit(Lottery, 'PlayerJoined')
        .withArgs(3, wallet4Address, 1, 300);
      //Only admin can pick a winner.
      await expect(Lottery.pickWinner()).to.emit(Lottery, 'LotteryResult').withArgs(1, 300);
      const winner = await Lottery.winners(1);
      console.log(winner);
      //Prize of the round should be transferred to winner's account.
      await expect(Lottery.collectPrize(1)).to.emit(Lottery, 'PrizeCollected').withArgs(winner, 300);
    });
  });
});
