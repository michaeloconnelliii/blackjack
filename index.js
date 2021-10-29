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
        let deckApiPath = `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${this.deckCount}`;
        let result = await axios.get(deckApiPath);
        this.deckId = result.data.deck_id;
        this.cardsRemaining = result.data.remaining;
    }

    async shuffle() {
        let deckApiPath = `https://deckofcardsapi.com/api/deck/${this.deckId}/shuffle/`;
        let result = await axios.get(deckApiPath);
        if(!result.data.success) {
            console.error('Deck failed to shuffle.');
        }
        this.cardsRemaining = result.data.remaining;
    }
    
}

let test = new Deck(2);

// Close front page on play a round button
let playBtn = document.getElementById('play-btn');
let frontPage = document.getElementById('front-page');

playBtn.addEventListener('click', () => {
    frontPage.classList.add('front-page-hidden');
});