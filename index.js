// TODO: display who won round which will likely involve flipping dealer card, update $ and start new round (undoing hidden to things, etc)

/* Objects, Constructors, Prototypes */
class Player {
    constructor(money, playersCardContainer, playersVisibleScore, playersMsg) {
        /* stats */
        this.money = money;
        this.score = 0;
        this.visibleScore = 0;
        this.bets = [];
        this.totalBet = 0;
        
        /* unique elements */
        this.cardContainer = playersCardContainer;
        this.visibleScoreElement = playersVisibleScore;
        this.msgElement = playersMsg;
    }
}

class Deck {
    constructor(deckCount) {
        this.deckCount = deckCount;
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
const dealBtn = document.getElementById('deal-btn');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const frontPage = document.getElementById('front-page');
const playModal = document.getElementById('play-modal');
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
        player.bets.splice(index, 1)
    }
    // player chose to place bet from player corner
    else {
        player.bets.push(betAmt);
    }

    player.totalBet += betAmt;
    player.money -= betAmt;
    return true;
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

/* Method that gets called every player turn before cards are dealt, updates environment for player */
function displayPlayerInfo() {
    playerAmt.textContent = `Player Bank: $${player.money}`;
    playerBet.textContent = `Bet: $${player.totalBet}`;
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

function displayScore(thePlayer) {
    let message;
    thePlayer === player ? message = `Player's score: ${thePlayer.visibleScore}` : message = `Dealer's (visible) score: ${thePlayer.visibleScore}`;
    thePlayer.visibleScoreElement.textContent = message;
    thePlayer.visibleScoreElement.classList.remove('hidden');
}

/* Initial card dealing and card setup */
async function dealCards(cardsPerPlayer, players) {
    // deal numCards per player
    const numPlayers = players.length;
    const cards = await deck.drawCards(cardsPerPlayer * numPlayers);
    
    console.log(cards);
    
    // delay for dealing cards
    let timeOut = 0;
    
    players.forEach( thePlayer => {
        for(let i = 0; i < cardsPerPlayer; i++) {
            // a card from the api call
            const theCard = cards.pop();
            
            // Create the card
            const newCard = document.createElement('div');

            // One dealer card should be hidden when dealing 2 cards per player
            newCard.style.backgroundImage = ((thePlayer === dealer) && (cardsPerPlayer > 1) && (i === 0)) ? `url("images/cards/card-back.png")`: `url(${theCard.image})`;
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
            displayScore(thePlayer)

            timeOut += 200;

            console.log(player.visibleScore)

            displayCardNum();
        }
    });

    return Promise.resolve('cards have been dealt');
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

async function startGame() {
    frontPage.classList.add('hidden');
    playModal.classList.remove('hidden');
    await deck.initDeck();
    // start player game with default bet of $100
    updateBet(100);
    displayPlayerInfo();
    dealBtn.classList.remove('hidden');
    enableDecreaseBet(true);
    displayCardNum();
}

/* Event Handlers */
/* Start the Game */
playBtn.addEventListener('click', () => {
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

/* Initial Deal Cards */
dealBtn.addEventListener('click', () => {
    dealCards(2, [player, dealer]);
    bank.classList.add('hidden');
    hideDealBtn(true);
    // Undo ability to remove chips
    enableDecreaseBet(false);
    displayHitAndStand();
});

standBtn.addEventListener('click', () => {
    displayPlayerMsg(player, 'Stand');
    dealerTurn();
})

function displayPlayerMsg(thePlayer, msg) {
    thePlayer.msgElement.classList.remove('hidden');
    thePlayer.msgElement.textContent = msg;
}

// Allows us to wait for player score to update before determining what to do with score
async function playerHit() {
    await dealCards(1, [player]);
    
    if(player.score > 21) {
        displayPlayerMsg(player, 'Bust!');
        dealerTurn();
    }
}

/* Hit */
hitBtn.addEventListener('click', playerHit);