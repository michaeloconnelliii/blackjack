// TODO: Clean up js for oop methods, split and insurance scenarios. Figure out what to do with dealer money.
// let player set player and dealer money at the beginning of the game. Player wins when dealer money is all gone.
// Doubling bet 
// Determine how to effectively split cards - wrap up second hand

/* Objects, Constructors, Prototypes */
class Player {
    constructor(money, playersCardContainer, playersVisibleScore, playersMsg) {
        /* stats */
        this.money = money;
        this.score = 0;
        this.visibleScore = 0;
        this.bets = [];
        this.totalBet = 0;
        this.cards = [];
        
        /* splitting stats */
        this.secondHand = false;
        this.firstHandBust = false;

        /* unique elements */
        this.cardContainer = playersCardContainer;
        this.visibleScoreElement = playersVisibleScore;
        this.msgElement = playersMsg;
    }
}

class Deck {
    constructor(deckCount) {
        this.deckCount = deckCount;
        // when deck reaches less than half it needs to be shuffled
        this.minBeforeShuffled = (52 * deckCount) / 2;
        this.splitCard = null;
        this.splitCardArr = [];
    }
       
    async initDeck() {
        const deckApiPath = `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${this.deckCount}`;
        const result = await axios.get(deckApiPath);
        if(!result.data.success) {
            console.error('initDeck() failed.');
        }
        this.deckId = result.data.deck_id;
        this.cardsRemaining = result.data.remaining;
    }

    async shuffle() {
        const deckApiPath = `https://deckofcardsapi.com/api/deck/${this.deckId}/shuffle/`;
        const result = await axios.get(deckApiPath);
        if(!result.data.success) {
            console.error('Deck failed to shuffle.');
        }
        this.cardsRemaining = result.data.remaining;
    }

    async drawCards(amt) {
        const deckApiPath = `https://deckofcardsapi.com/api/deck/${this.deckId}/draw/?count=${amt}`;
        const result = await axios.get(deckApiPath);
        if(!result.data.success) {
            console.error('Failed to draw cards.');
        }
        this.cardsRemaining = result.data.remaining;
        return result.data.cards;
    }
}

/* Global Objects */
const playBtn = document.getElementById('play-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const dealBtn = document.getElementById('deal-btn');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const splitBtn = document.getElementById('split-btn');
const frontPage = document.getElementById('front-page');
const playModal = document.getElementById('play-modal');
const gameOverModal = document.getElementById('game-over-modal');
const bank = document.getElementById('bank-modal');
const playerAmt = document.getElementById('player-amt');
const playerBet = document.getElementById('player-bet');
const playerScore = document.getElementById('player-visible-score');
const dealerScore = document.getElementById('dealer-visible-score');
const playerMsg = document.getElementById('player-msg');
const dealerMsg = document.getElementById('dealer-msg');
const cardAmt = document.getElementById('card-amt');
const dealerCardContainer = document.getElementById('dealer-card-container');
const playerCardContainer = document.getElementById('player-card-container');
const oneChips = document.getElementById('one-chips-container');
const twentyFiveChips = document.getElementById('twenty-five-chips-container');
const fiftyChips = document.getElementById('fifty-chips-container');
const oneHundredChips = document.getElementById('hundred-chips-container');
const fiveHundredChips = document.getElementById('five-hundred-chips-container');
const betOneChips = document.getElementById('bet-one-chips-container');
const betTwentyFiveChips = document.getElementById('bet-twenty-five-chips-container');
const betFiftyChips = document.getElementById('bet-fifty-chips-container');
const betOneHundredChips = document.getElementById('bet-hundred-chips-container');
const betFiveHundredChips = document.getElementById('bet-five-hundred-chips-container');

const startingMoney = 2000;
const startingDecks = 2;

let player = new Player(startingMoney, playerCardContainer, playerScore, playerMsg);
let dealer = new Player(startingMoney, dealerCardContainer, dealerScore, dealerMsg);
let deck = new Deck(startingDecks);

/* Functions */
function displayCardNum() {
    cardAmt.textContent = `Cards Remaining: ${deck.cardsRemaining}`;
}

function displayHitAndStand() {
    hitBtn.classList.remove('hidden');
    standBtn.classList.remove('hidden');
}

function checkForSplit() {
    console.log(player.cards);
    const playerHasEnoughMoney = (player.money >= (player.totalBet * 2));
    const cardsHaveSameVal = (convertToValue(player.cards[0].value) === convertToValue(player.cards[1].value))
    return playerHasEnoughMoney && cardsHaveSameVal;
}

// Update bet amount for Player if the bet is possible, don't do anything if it isn't
// Remove a bet from the player's bets queue if bet is negative (player selected bet from bet counter to remove)
function updateBet(betAmt) {
    // player attempted to bet more than they had
    if(betAmt > player.money) {
        return false;
    }

    // player chose to remove bet from center betting table
    if(betAmt < 0) {
        // bets queue only has positive amounts, look up abs value
        let index = player.bets.indexOf(Math.abs(betAmt));
        player.bets.splice(index, 1);
    }
    // player chose to place bet from player corner
    else {
        player.bets.push(betAmt);
    }

    player.totalBet += betAmt;
    player.money -= betAmt;
    return true;
}

// Used inbetween rounds. If player's previous bet is too high, then adjust it to match how much money they have.
// This only occurs if player lost
function adjustPreviousBet() {
    const chipAmts = [ 500, 100, 50, 25, 1 ];

    // We need to reset the bet
    if(player.money < player.totalBet) {
        // clear out player's bet queue
        while(player.bets.length > 0) {
            player.bets.pop();
        }

        player.totalBet = 0;

        // update player's bet queue to match their money amount
        chipAmts.forEach( chipAmt => {
            while(chipAmt <= player.money) {
                updateBet(chipAmt);
            }
        });
    }
    // repeat previous bet
    else {
        player.money -= player.totalBet;
    }
}

// Displays appropriate number of chips. For example, if a user only has $4, a $1 chip will be displayed and no others 
function displayBankChips() {
    const chipAmtToContainer = {
        1: oneChips,
        25: twentyFiveChips,
        50: fiftyChips,
        100: oneHundredChips,
        500: fiveHundredChips
    };

    console.log(player.bets);

    for(amt in chipAmtToContainer) {
        // If player has enough money for a chip, make it visible
        const hasChip = ((player.money / amt) >= 1);
        const chipContainer = chipAmtToContainer[amt];
        
        hasChip ? chipContainer.classList.remove('hidden') : chipContainer.classList.add('hidden');
    }
}

/* Run through Player's bets queue and make bet visible on bet table if bet exists (player chose bet), hide everything else */
function displayBetChips() {
    const chipAmtToContainer = {
        1: betOneChips,
        25: betTwentyFiveChips,
        50: betFiftyChips,
        100: betOneHundredChips,
        500: betFiveHundredChips
    };

    for(amt in chipAmtToContainer) {
        const chipContainer = chipAmtToContainer[amt];
        (player.bets.indexOf(Number(amt)) >= 0) ? chipContainer.classList.remove('hidden') : chipContainer.classList.add('hidden');
    }
}

function hideDealBtn(hide) {
    hide ? dealBtn.classList.add('hidden') : dealBtn.classList.remove('hidden');
}

function displayBankBet() {
    playerAmt.textContent = `Player Bank: $${player.money}`;
    playerBet.textContent = `Bet: $${player.totalBet}`;
}

/* Method that gets called every player turn before cards are dealt, updates environment for player */
function displayPlayerInfo() {
    displayBankBet();
    displayBankChips();
    displayBetChips();
    console.log(player.money);
    hideDealBtn(player.totalBet <= 0);
}

/* Convert abstract non-numerical (king, jack, queen. etc) values and all other value strings (1, 2, 3, etc) to numerical (Number) values */
function convertToValue(cardVal) {
    const cardValToScoreVal = {
        'ACE': (player.score + 11 > 21 ? 1 : 11),
        'KING': 10,
        'QUEEN': 10,
        'JOKER': 10,
        'JACK': 10
    }

    return Number(cardValToScoreVal.hasOwnProperty(cardVal) ? cardValToScoreVal[cardVal] : cardVal);
}

/* Game is over once player runs out of money - this will be extended for dealer, too */
function checkGameoverAndEnd() {
    if(player.money <= 0 && player.totalBet <= 0) {
        playModal.classList.add('hidden');
        gameOverModal.classList.remove('hidden');
    }
}

function displayWinnerUpdateMoney() {
    if(((dealer.score < player.score) && player.score <= 21) || dealer.score > 21) {
        player.money += (player.totalBet * 2);
        dealer.money -= player.totalBet;
        
        playerMsg.textContent = 'Player wins!';
        dealerMsg.textContent = 'Dealer lost!';
        return true;
    }
    else if(((dealer.score > player.score) && dealer.score <= 21) || player.score > 21) {
        // Player money is moved from money to bet already
        dealer.money += (player.totalBet * 2);

        playerMsg.textContent = 'Player lost!';
        dealerMsg.textContent = 'Dealer wins!';
        return false;
    }
    else {
        playerMsg.textContent = 'Draw!';
        dealerMsg.textContent = 'Draw!';
        return true;
    }
}

function displayScore(players, endOfRound) {
    let message;
    
    players.forEach( thePlayer => {
        if(!endOfRound) {
            thePlayer === player ? message = `Player's score: ${thePlayer.visibleScore}` : message = `Dealer's (visible) score: ${thePlayer.visibleScore}`;
        }
        else {
            thePlayer === player ? message = `Player's final score: ${thePlayer.score}` : message = `Dealer's final score: ${thePlayer.score}`;
        }
    
        thePlayer.visibleScoreElement.textContent = message;
        thePlayer.visibleScoreElement.classList.remove('hidden');
    });
}

function flipDealerCard() {
    const flipCard = document.getElementById('flip-card');

    if(flipCard === null) {
        console.error("called flipDealerCard when cards haven't been dealt.");
    }
    else {
        flipCard.classList.add('flip-card-turn');
    }
}

/* card dealing and card setup */
async function dealCards(cardsPerPlayer, players, cards) {
    if(cards === undefined) {
        // deal numCards per player
        const numPlayers = players.length;
        cards = await deck.drawCards(cardsPerPlayer * numPlayers);
    }

    console.log(cards);
    
    // delay for dealing cards
    let timeOut = 0;
    
    players.forEach( thePlayer => {
        for(let i = 0; i < cardsPerPlayer; i++) {
            // a card from the api call
            const theCard = cards.pop();
            
            // store the card in player's card array for other uses (checking for split, insurance, etc.)
            thePlayer.cards.push(theCard);
            
            // Create the card
            const newCard = document.createElement('div');
            
            // Flip card
            if((thePlayer === dealer) && (cardsPerPlayer > 1) && (i === 0)) {
                newCard.setAttribute('id', 'flip-card');
                newCard.classList.add('flip-card');

                // Setup the child class hierarchy for flip card
                const innerCard = document.createElement('div');
                const flipCardFront = document.createElement('div');
                const flipCardBack = document.createElement('div');
                
                innerCard.classList.add('flip-card-inner');
                flipCardFront.classList.add('flip-card-front');
                flipCardBack.classList.add('flip-card-back');
                flipCardBack.style.backgroundImage = `url(${theCard.image})`;

                newCard.appendChild(innerCard);
                innerCard.appendChild(flipCardFront);
                innerCard.appendChild(flipCardBack);
            }
            else {
                // One dealer card should be hidden when dealing 2 cards per player
                newCard.style.backgroundImage = `url(${theCard.image})`;
            }

            newCard.classList.add('card');

            // update score and visible score
            const cardVal = convertToValue(theCard.value);
            thePlayer.score += cardVal;
            thePlayer.visibleScore += ((thePlayer === dealer) && (cardsPerPlayer > 1) && (i === 0)) ? 0 : cardVal;
            
            // put cards in player/dealer area
            setTimeout(() => {
                thePlayer.cardContainer.appendChild(newCard); 
            }, timeOut);

            // update player's visible score
            displayScore([thePlayer], false)

            timeOut += 200;

            console.log(player.visibleScore)

            displayCardNum();
        }
    });

    // Check if deck needs to be shuffled
    if(deck.cardsRemaining <= deck.minBeforeShuffled) {
        await deck.shuffle();
        displayCardNum();
        cardAmt.textContent += '\n(Shuffled)';
    }

    return Promise.resolve('cards have been dealt');
}

function clearCardArr(players) {
    players.forEach( thePlayer => {
        // clear out the array
        thePlayer.cards.splice(0, thePlayer.cards.length);
    });
}

async function removeCards(players) {
    let removeCards = [];
    
    // move player cards off table
    for(thePlayer of players) {
        for(card of thePlayer.cardContainer.children) {
            removeCards.push(card);
            card.classList.add('remove-card');
            await dealerWait(500);
        }
    }

    // remove card elements permanently
    removeCards.forEach( card => { 
        card.remove();
    });
}

// Helper method for simulate dealer taking some time before making a decision
function dealerWait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function dealerTurn() {
    await dealerWait(1000);
    // remove hit and stand options so dealer can't be interrupted
    hitBtn.classList.add('hidden');
    standBtn.classList.add('hidden');

    // dealer hits on soft 17 and player hasn't busted
    while(dealer.score < 17 && player.score < 22) {
        console.log(`dealer score: ${dealer.score}`);
        await dealCards(1, [dealer]);
        await dealerWait(1500);
    }

    dealer.score > 21 ? displayPlayerMsg(dealer, 'Dealer bust!') : displayPlayerMsg(dealer, 'Dealer stands');
}

function startRound() {
    displayPlayerInfo();
    player.score = 0;
    player.visibleScore = 0;
    dealer.score = 0;
    dealer.visibleScore = 0;
    dealBtn.classList.remove('hidden');
    bank.classList.remove('hidden');
    playerMsg.classList.add('hidden');
    dealerMsg.classList.add('hidden');
    playerScore.classList.add('hidden');
    dealerScore.classList.add('hidden');
    enableDecreaseBet(true);
    displayCardNum();
}

async function startGame() {
    frontPage.classList.add('hidden');
    playModal.classList.remove('hidden');
    await deck.initDeck();
    // start player game with default bet of $100
    updateBet(100);
    startRound();
}

/* Event Handlers */
/* Start the Game */
playBtn.addEventListener('click', () => {
    startGame();
});

/* Allow player to play again after game over */
playAgainBtn.addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    player.bank = 2000;
    startGame();
});

/* Increase bet */
const bankChips = { 
    1: oneChips, 
    25: twentyFiveChips, 
    50: fiftyChips, 
    100: oneHundredChips, 
    500: fiveHundredChips 
};

Object.entries(bankChips).forEach( (pair) => {
    const [ amt, chip ] = pair;
    chip.addEventListener('click', () => {
        updateBet(Number(amt));
        displayPlayerInfo();
    });
});

/* Decrease bet */
const dealerChips = {
    1: betOneChips,
    25: betTwentyFiveChips,
    50: betFiftyChips,
    100: betOneHundredChips,
    500: betFiveHundredChips
};


/* Helper method for enableDecreaseBet s.t. we can reference the method when removing the event listeners */
function updateDisplay(e) {
    const amt = e.currentTarget.param;

    updateBet(Number(-amt));
    displayPlayerInfo();
}

/* For adding and removing ability to remove bets from the dealer counter. 
   We don't want player to do this once cards are dealt. 
   The 'select' class changes cursor to pointer */
function enableDecreaseBet(allow) {
    // Add the event listener
    if(allow) {
        Object.entries(dealerChips).forEach( (pair) => {
            const [ amt, chip ] = pair;
            chip.param = amt;
            chip.classList.add('select');
            chip.addEventListener('click', updateDisplay);
        });
    }
    // Remove the event listener
    else {
        Object.entries(dealerChips).forEach( (pair) => {
            const [ amt, chip ] = pair;
            chip.classList.remove('select');
            chip.removeEventListener('click', updateDisplay);
        });
    }
}

async function dealAction() {
    clearCardArr([player, dealer]);
    await dealCards(2, [player, dealer]);
    bank.classList.add('hidden');
    hideDealBtn(true);
    // Undo ability to remove chips
    enableDecreaseBet(false);
    displayHitAndStand();
    // checkForSplit, displaySplit
    console.log(checkForSplit());
}

/* Initial Deal Cards */
dealBtn.addEventListener('click', () => {
    dealAction();
});

async function playerStand() {
    displayPlayerMsg(player, 'Stand');
    await dealerTurn();
    flipDealerCard();
    displayScore([player, dealer], true);
    const playerWin = displayWinnerUpdateMoney();
    displayBankBet();
    await dealerWait(2000);
    
    // only remove player cards on a split
    if(!player.secondHand) {
        await removeCards([player, dealer]);
    } else {
        await removeCards([player]);
    }

    if(!playerWin) {
        adjustPreviousBet();
        checkGameoverAndEnd();
    }

    // don't start round if calling this from split
    if(!player.secondHand) {
        startRound();
    } else {
        player.secondHand = false;
    }
}

standBtn.addEventListener('click', playerStand);

function displayPlayerMsg(thePlayer, msg) {
    thePlayer.msgElement.classList.remove('hidden');
    thePlayer.msgElement.textContent = msg;
}

// Allows us to wait for player score to update before determining what to do with score
async function playerHit() {
    await dealCards(1, [player]);
    
    if(player.score > 21) {
        displayPlayerMsg(player, 'Bust!');
        await dealerTurn();
        flipDealerCard();
        displayScore([player, dealer], true)
        const playerWin = displayWinnerUpdateMoney();
        displayBankBet();
        await dealerWait(1500);
        removeCards([player, dealer]);

        if(!playerWin) {
            adjustPreviousBet();
            checkGameoverAndEnd();
        }

        startRound();
    }
}

/* Hit */
hitBtn.addEventListener('click', playerHit);

async function splitPlayerHit() {
    await dealCards(1, [player]);
    await dealerWait(1500);
    
    if(player.score > 21) {
        displayPlayerMsg(player, 'Bust!');
        displayScore([player], true);
        await removeCards([player]);

        // reset score for first hand
        player.score = 0;
        player.visibleScore = 0;

        if(!player.secondHand) {
            player.money -= player.totalBet;
            displayBankBet();

            // let player start next hand (next split card)
            await dealCards(1, [player], [deck.splitCardArr[0]]);
            displayPlayerMsg(player, 'Split hand (2/2)');
            player.secondHand = true;
            player.firstHandBust = true;

            // update event listeners
            hitBtn.removeEventListener('click', splitPlayerHit);
            hitBtn.addEventListener('click', playerHit);
        }
    }
}

async function splitPlayerStand() {
    if(!player.secondHand) {
        displayPlayerMsg(player, 'Stand');

        console.log(deck.splitCardArr);
        console.log(player.cards);
        
        // stash away first hand
        while(player.cards.length > 0) {
            deck.splitCardArr.push(player.cards.pop());
        }

        // remove the cards
        player.score = 0;
        player.visibleScore = 0;
        await removeCards([player]);
        deck.splitCardArr.shift();

        // let player start next hand (next split card)
        dealCards(1, [player], [deck.splitCardArr[0]]);

        displayPlayerMsg(player, 'Split hand (2/2)');
        
        player.secondHand = true;
    } else {
        
        // if player busted on first hand, don't circle back to it
        if(!player.firstHandBust) {
            // cash out second hand
            await playerStand();

            // reset score for first hand
            player.score = 0;
            player.visibleScore = 0;
            displayPlayerMsg(player, 'Split hand (1/2)');
            
            // lay down first hand
            dealCards(deck.splitCardArr.length, [player], deck.splitCardArr);
            
            // cash out first hand
            await playerStand();
        } else {
            player.secondHand = false;
            
            // cash out second hand
            await playerStand();
        }

        // update event listeners

        // update player split attributes
        player.secondHand = false;
        player.firstHandBust = false;
    }
}

async function split() {
    // bet is temporarily doubled
    const betAmt = player.totalBet * 2;

    // temporarily remove one of the cards
    const tempCardVal = convertToValue(player.cards[1].value);
    const tempCard = player.cardContainer.children[1];
    tempCard.classList.add('remove-card');
    await dealerWait(500);
    player.cardContainer.children[1].remove();

    deck.splitCardArr.push(player.cards[1]);
    player.cards.pop();

    // update score
    player.visibleScore -= tempCardVal;
    player.score -= tempCardVal;
    displayScore([player], false);

    // give player card for first hand
    displayPlayerMsg(player, 'Split hand (1/2)');
    await dealCards(1, [player]);

    // update event listeners for hit and stand
    hitBtn.removeEventListener('click', playerHit);
    standBtn.removeEventListener('click', playerStand);

    hitBtn.addEventListener('click', splitPlayerHit);
    standBtn.addEventListener('click', splitPlayerStand);

    player.secondHand = false;
}

/* Split */
splitBtn.addEventListener('click', split);