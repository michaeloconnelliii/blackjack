/* Objects, Constructors, Prototypes */
class Player {
    constructor(money) {
        this.money = money;
    }

    getMoney() {
        return this.money;
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

const startingMoney = 2000;
const startingDecks = 2;

let player = new Player(startingMoney);
let dealer = new Player(startingMoney);
let deck = new Deck(startingDecks);

/* Functions */
function displayCardNum(cardNum) {
    const cardAmt = document.getElementById('card-amt');
    cardAmt.textContent += cardNum;
}

async function startGame() {
    frontPage.classList.add('hidden');
    playModal.classList.remove('hidden');
    
    displayBank();
    
    await deck.initDeck();
    dealBtn.classList.remove('hidden');
    displayCardNum(deck.cardsRemaining);
}

/* TODO
   - Add chips
   -      */
function displayBank() {
    const bank = document.getElementById('bank-modal');
    bank.textContent = `$${player.money}`;
}

/* Event Handlers */
/* Start the Game */
playBtn.addEventListener('click', () => {
    startGame();
});

/* Deal Cards */
dealBtn.addEventListener('click', () => {
    deck.drawCards(4)
    .then( (cards) => {
        console.log(cards);
    });
})