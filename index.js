/* Objects, Constructors, Prototypes */
class Player {
    constructor(money) {
        this.money = money;
        this.score = 0;
        this.bets = [];
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
const frontPage = document.getElementById('front-page');
const playModal = document.getElementById('play-modal');
const bank = document.getElementById('bank-modal');
const playerAmt = document.getElementById('player-amt');
const playerBet = document.getElementById('player-bet');
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

let player = new Player(startingMoney);
let dealer = new Player(startingMoney);
let deck = new Deck(startingDecks);

/* Functions */
function displayCardNum(cardNum) {
    cardAmt.textContent += cardNum;
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

    for(amt in chipAmtToContainer) {
        // If player has enough money for a chip, make it visible
        const hasChip = ((player.money / amt) >= 1);
        const chipContainer = chipAmtToContainer[amt];
        
        hasChip ? chipContainer.classList.remove('hidden') : chipContainer.classList.add('hidden');
    }
}

function displayBetChips() {
    const chipAmtToContainer = {
        1: betOneChips,
        25: betTwentyFiveChips,
        50: betFiftyChips,
        100: betOneHundredChips,
        500: betFiveHundredChips
    };

    let isChipDisplayed = {
        1: false,
        25: false,
        50: false,
        100: false,
        500: false
    };

    player.bets.forEach( (bet) => {
        isChipDisplayed[bet] = true;
    });

    for(amt in isChipDisplayed) {
        const chipContainer = chipAmtToContainer[amt];
        isChipDisplayed[amt] ? chipContainer.classList.remove('hidden') : chipContainer.classList.add('hidden');
    }
}

// Get player's total bet by adding bets in their 'bets' queue
function getTotalBet(thePlayer) {
    let totalBet = 0;
    thePlayer.bets.forEach( bet => {
        thePlayer.money -= bet;
        totalBet += bet;
    });

    return totalBet;
}


/* Method that gets called every player turn before cards are dealt */
function displayPlayerInfo() {
    playerAmt.textContent += `$${player.money}`;
    playerBet.textContent += `$${getTotalBet(player)}`;
    displayBankChips();
    displayBetChips();
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

/* Initial card dealing and card setup */
async function dealCards() {

    const cards = await deck.drawCards(4);
    console.log(cards);
    
    // player and dealer each get 2 cards
    let timeOut = 0;

    cards.forEach( ( card, i ) => {
        // Create the card
        const newCard = document.createElement('div');
        // One dealer card should be hidden
        newCard.style.backgroundImage = (i === 2 ? `url("images/cards/card-back.png")`: `url(${card.image})`);
        newCard.classList.add('card');

        if(i < 2) {
            player.score += convertToValue(card.value);
            // put cards in player area
            setTimeout(() => {
                playerCardContainer.appendChild(newCard); 
            }, timeOut);
        }
        else {
            dealer.score += convertToValue(card.value);
            // put cards in dealer area
            setTimeout(() => {
                dealerCardContainer.appendChild(newCard); 
            }, timeOut);
        }

        timeOut += 200;
        
    });
}

async function startGame() {
    frontPage.classList.add('hidden');
    playModal.classList.remove('hidden');
    // start player game with default bet of $100
    player.bets.push(100);
    displayPlayerInfo();
    
    await deck.initDeck();
    dealBtn.classList.remove('hidden');
    displayCardNum(deck.cardsRemaining);
}

/* Event Handlers */
/* Start the Game */
playBtn.addEventListener('click', () => {
    startGame();
});

/* Initial Deal Cards */
dealBtn.addEventListener('click', () => {
    dealCards();
});