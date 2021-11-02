/* Objects, Constructors, Prototypes */
class Player {
    constructor(money) {
        this.money = money;
        this.score = 0;
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
const cardAmt = document.getElementById('card-amt');
const onesChips = document.getElementById('one-chips-container');
const twentyFivesChips = document.getElementById('twenty-five-chips-container');
const fiftyChips = document.getElementById('fifty-chips-container');
const oneHundredChips = document.getElementById('hundred-chips-container');
const fiveHundredChips = document.getElementById('five-hundred-chips-container');

const startingMoney = 2000;
const startingDecks = 2;

let player = new Player(startingMoney);
let dealer = new Player(startingMoney);
let deck = new Deck(startingDecks);

/* Functions */
function displayCardNum(cardNum) {
    cardAmt.textContent += cardNum;
}

// Displays appropriate number of chips. For example, if a user only has $4, 4, $1 chips will be displayed and no others 
function displayChips() {
    chipAmtToContainer = {
        1: onesChips,
        25: twentyFivesChips,
        50: fiftyChips,
        100: oneHundredChips,
        500: fiveHundredChips
    };

    const maxDisplayedChips = 5;

    for(amt in chipAmtToContainer) {
        let chipAmt = Math.floor(player.money / amt);
        const chipContainer = chipAmtToContainer[amt];
        const chipElements = chipContainer.children;

        chipAmt = (chipAmt >= maxDisplayedChips ? maxDisplayedChips : chipAmt);
        
        // Make correct number of chips visible
        for(let i = 0; i < chipAmt; i++) {
            chipElements[i].classList.remove('hidden');
        }

        // Make the rest of chips hidden
        for(let i = chipAmt; i < maxDisplayedChips; i++) {
            chipElements[i].classList.add('hidden');
        }

        // Hide the container if there aren't any chips visible
        chipAmt <= 0 ? chipContainer.classList.add('hidden') : chipContainer.classList.remove('hidden');
    }
}

/* Method that gets called every player turn before cards are dealt */
function displayBank() {
    playerAmt.textContent += `$${player.money}`;
    displayChips();
}

/* Convert abstract non-numerical (king, jack, queen. etc) values and all other value strings (1, 2, 3, etc) to numerical (Number) values */
function convertToValue(cardVal) {
    const cardValToScoreVal = {
        'ACE': (player.score >= 21 ? 1 : 11),
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
    
    // player and dealer each get 2 cards
    cards.forEach( ( card, i ) => {
        if(i < 2) {
            player.score += convertToValue(card.value);
            // put cards in player area
        }
        else {
            dealer.score += convertToValue(card.value);
            // put cards in dealer area
        }
    });
}

async function startGame() {
    frontPage.classList.add('hidden');
    playModal.classList.remove('hidden');
    
    displayBank();
    
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