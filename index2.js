// TODO: Clean up js for oop methods, split and insurance scenarios. Figure out what to do with dealer money.
// let player set player and dealer money at the beginning of the game. Player wins when dealer money is all gone.
// Doubling bet 
// Determine how to effectively split cards - wrap up second hand

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

/* Containers for player chips objects for easy conversion to money amount */
const betChipContainer = {
    1: betOneChips,
    25: betTwentyFiveChips,
    50: betFiftyChips,
    100: betOneHundredChips,
    500: betFiveHundredChips
};

const bankChipContainer = {
    1: oneChips,
    25: twentyFiveChips,
    50: fiftyChips,
    100: oneHundredChips,
    500: fiveHundredChips
};

/* Objects, Constructors, Prototypes */
class Player {
    constructor(money, playersCardContainer, playersVisibleScore, playersMsg, amtElement, 
                betElement, betChipContainer, bankChipContainer) {
        /* stats */
        this.money = money;
        this.score = 0;
        this.visibleScore = 0;
        this.bets = [];
        this.totalBet = 0;
        this.cards = [];
        
        /* unique HTML elements to each player */
        this.cardContainer = playersCardContainer;
        this.visibleScoreElement = playersVisibleScore;
        this.msgElement = playersMsg;
        this.amtElement = amtElement;
        this.betElement = betElement;
        this.betChipContainer = betChipContainer;
        this.bankChipContainer = bankChipContainer;
    }

    /* Updates players bet (both the bets queue and totalBet). Returns true or false whether successful.
       
       betAmt can be positive or negative (adding/removing chips from betting table). */
    updateBet(betAmt) {
        // player attempted to bet more than they had
        if(betAmt > this.money) {
            return false;
        }

        // player chose to remove bet from center betting table
        if(betAmt < 0) {
            // bets queue only has positive amounts, look up abs value
            let index = this.bets.indexOf(Math.abs(betAmt));
            this.bets.splice(index, 1);
        }
        // player chose to place bet from player corner
        else {
            this.bets.push(betAmt);
        }

        this.totalBet += betAmt;
        this.money -= betAmt;
        return true;
    }

    resetScore(score, visibleScore) {
        if(score) {
            this.score = 0;
        }

        if(visibleScore) {
            this.visibleScore = 0;
        }
    }

    // Update bank and bet amount in HTML
    displayBankAndBet() {
        this.amtElement.textContent = `Player Bank: $${this.money}`;
        this.betElement.textContent = `Bet: $${this.totalBet}`;
    }

    // Displays player's betting chips they've selected
    displayBetChips() {
        for(const amt in this.betChipContainer) {
            const chipContainer = this.betChipContainer[amt];
            (this.bets.indexOf(Number(amt)) >= 0) ? chipContainer.classList.remove('hidden') : chipContainer.classList.add('hidden');
        }
    }

    // Displays appropriate number of chips. For example, if a user only has $4, a $1 chip will be displayed and no others 
    displayBankChips() {
        for(const amt in this.bankChipContainer) {
            // If player has enough money for a chip, make it visible
            const hasChip = ((this.money / amt) >= 1);
            const chipContainer = this.bankChipContainer[amt];

            hasChip ? chipContainer.classList.remove('hidden') : chipContainer.classList.add('hidden');
        }
    }

    displayInfo() {
        this.displayBankAndBet();
        this.displayBetChips();
        this.displayBankChips();
        
        console.log(this.money);        
    }
}

class Deck {
    constructor(deckCount) {
        this.deckCount = deckCount;
        
        // when deck reaches less than half it needs to be shuffled
        this.minBeforeShuffled = (52 * deckCount) / 2;
        this.cardsRemaining = 0;
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

/* Game object controls game features and game loop. Adding additional players or 2-player capability will be done here. 
   
   For now, the implementation is one player against a computer.  */
class Game {
    constructor(startingMoney, startingDeckAmt) {
        this.player = new Player(startingMoney, playerCardContainer, playerScore, playerMsg, playerAmt, playerBet,
                                 betChipContainer, bankChipContainer);
        this.dealer = new Player(startingMoney, dealerCardContainer, dealerScore, dealerMsg);
        this.deck = new Deck(startingDeckAmt);
    }

    async initGame() {    
        // Remove the "Blackjack" intro screen
        addRemoveHiddenClass([frontPage], [playModal]);
        
        await this.deck.initDeck();
        
        // start player game with default bet of $100
        this.player.updateBet(100);
    }

    /* Hide the deal button if player's bet is nonexistent, can't deal without a bet */
    hideDealBtn() {
        this.player.totalBet <= 0 ? dealBtn.classList.add('hidden') : dealBtn.classList.remove('hidden');
    }

    /* Helper method for enableBet s.t. we can reference the method when removing the event listeners
       
       Note that amt is passed in via bind() in enableBet 
       See https://stackoverflow.com/questions/256754/how-to-pass-arguments-to-addeventlistener-listener-function for reference */
    updateBetDisplayInfo(amt, increase) {
        increase ? this.player.updateBet(Number(amt)) : this.player.updateBet(Number(-amt));
        this.player.displayInfo();

        // Hide the deal button if player has removed all their bets from the betting counter
        this.hideDealBtn();
    }

    /* For adding and removing ability to add/remove bets from the dealer counter or player corner so player cannot bet/remove bet
       at specific game states. For example, we don't want player to do this once cards are dealt. 
       
       Note: The 'select' class changes cursor to pointer */
    enableBet(allow, increase) {
        let chipContainer;
        increase ? chipContainer = this.player.bankChipContainer : chipContainer = this.player.betChipContainer;

        Object.entries(chipContainer).forEach( (pair) => {
            const [ amt, chip ] = pair;
            chip.amt = amt;
            
            if(allow) {
                chip.classList.add('select');
                if(increase) {
                    chip.addEventListener('click', this.updateBetDisplayInfo.bind(this, amt, true));
                }
                else {
                    chip.addEventListener('click', this.updateBetDisplayInfo.bind(this, amt, false));
                }
            }
            else {
                chip.classList.remove('select');
                chip.removeEventListener('click', this.updateBetDisplayInfo);
            }
        });
    }

    enableDecreaseBet(allow) {
        this.enableBet(allow, false);
    }

    enableIncreaseBet(allow) {
        this.enableBet(allow, true);
    }

    displayCardNum() {
        cardAmt.textContent = `Cards Remaining: ${this.deck.cardsRemaining}`;
    }

    startRound() {
        this.player.displayInfo();
        
        this.player.resetScore(true, true);
        this.dealer.resetScore(true, true);

        this.hideDealBtn();
        addRemoveHiddenClass([this.player.msgElement, this.dealer.msgElement, this.player.visibleScoreElement, this.dealer.visibleScoreElement], 
                        [dealBtn, bank]);
        
        this.enableDecreaseBet(true);
        this.enableIncreaseBet(true);
        
        this.displayCardNum();
    }

    async startGame() {
        await this.initGame();
        this.startRound();
    }
}

/* Helper methods */

/* Adds or removes the "hidden" class attribute to specified elements when multiple elements need to be hidden/unhidden.
   
   addHiddenObjs and removeHiddenObjs should be lists. 
   
   For each element in the list, "hidden" will be added or removed from their class list, respectively. */
function addRemoveHiddenClass(addHiddenObjs, removeHiddenObjs) {
    addHiddenObjs.forEach( ( obj ) => {
        obj.classList.add('hidden');
    });

    removeHiddenObjs.forEach( ( obj ) => {
        obj.classList.remove('hidden');
    });
}

/* Adds or removes event listeners to specified elements. Used for a single event needs to be added to one element and removed from another.
   
   addEventListeners and removeEventListeners should be lists. 
   
   For each element in the list, the specified function (fn) will be added or removed as an event (click, resize, etc) listener, 
   respectively. */
function addRemoveEventListeners(addEventListeners, removeEventListeners, event , fn) {
    addEventListeners.forEach( ( obj ) => {
        obj.addEventListener(event, fn);
    });

    removeEventListeners.forEach( ( obj ) => {
        obj.removeEventListener(event, fn);
    });
}

/* Initializing objects */
const startingMoney = 2000;
const startingDecks = 2;

let blackjack = new Game(startingMoney, startingDecks);

/* Event Handlers */
playBtn.addEventListener('click', () => {
    blackjack.startGame();
});

/* Initial Deal Cards */
dealBtn.addEventListener('click', () => {
    blackjack.dealAction();
});

/* Game loop */