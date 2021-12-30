# Blackjack
## Background
Simple Blackjack game built using HTML, CSS and vanilla Javascript. It uses the <a href="https://deckofcardsapi.com/">Deck of Cards API</a> for generating the deck and handling cards.

## Project Overview
At a high level, the game is run from a Game object called 'blackjack' where two 'Player' objects are managed. The dealer's (the 'Player' object, 'dealer' in the Game class) actions are written in Game's "DealerTurn" method. The cards are managed in the Deck class and are retrieved from the deck of cards API. The objective of the game is to accrue as much money as possible. The game is over when the player's balance reaches $0.

### Event listeners
The game's logic is implemented in index.js. The the game flow is controlled using event listeners depending on what a player selects. Therefore all logic stems from main event listeners that are attached to the 'Start Game', 'Deal Cards', 'Hit', and 'Stand' buttons. The functions associated with these event listeners are implemented in the Game class.

### Classes
The game is run from a 'Game' object instance (derived from the 'Game' class) called 'blackjack'. The Game class contains two 'Player'
object instances (derived from the 'Player' class) called 'player' and 'dealer'. The Game class also contains one 'Deck' object instance (derived from the 'Deck' class) called 'deck'.

#### Game
The Game class controls actions that affect the entire blackjack table. This includes adding and removing event listeners for the clickable chips, changing what is displayed and isn't, determining who won the round (player or dealer), dealing cards, dealer AI and managing player's actions (hitting, standing, etc).

#### Player
The Game class contains two Player Class instances: player and dealer. The Player Class is responsible for actions that affect only the player such as updating/displaying a player's money or messages or displaying cards in the player's corner. Hitting and standing actions are not implemented here because these actions have game-wide effects (such as controlling when the dealer goes, clearing the table once the action is over, etc).

#### Deck
The Game class contains one Deck class instance: deck. The Deck Class is responsible for making asynchronous calls to the Deck of Cards API (such as getting a fresh deck, getting card objects using our deck id, etc) as well as simple, static card-specific methods such as getting the value of a Deck of Cards "card" object or determining if an ace should be 11 or 1.

### Main Actions
From the 'Event listeners' sub-section above, the main actions for the game are: Starting the game, dealing cards, hitting and standing. I'll describe each of them below. Look at the 'Event Listeners' section in index.js and follow along with this section once you understand the general layout of the game specified in the sections above.

#### Starting the game
The startGame method in the Game class consists of the Game class methods: initGame and startRound.

##### initGame()
Initalizes our deck object (deck.initDeck - where we get a new deck ID from the Deck of Cards API) and hides our intro screen.

##### startRound()
This method is called to actually start the round and allow the Player to begin betting and display the 'deal cards' button. Here, we initalize the player and dealer's score to 0, update the Player's high score (max money won for the game), enable our event listeners on the chips so the player can bet or retract their bet, and display the cards left in our deck object.

#### Dealing the cards
The dealAction method in the Game class consists of the Game class methods: clearCardArr and dealCards.

##### clearCardArr()
Clears out our Player card array (member in the Player class) such that the array is empty.

##### dealCards()
Uses the card objects obtained from deck.drawCards to populate the Player card array, display the cards (player.displayCards), update player and dealer scores, and determine whether the deck needs to be shuffled (needs a new ID because the cards are getting low).

#### Hitting and Standing
The hit and split method in the Game class consists of the Game class method: endPlayerTurn().

##### endPlayerTurn()
Allows the dealer to have a turn (implemented in Game's dealerTurn - where dealer hits until they get a soft 17 or stands before if player busts), flip the unshown dealer card, update the results of the hand, and then remove the cards from the table (both by animating this and actually removing the card objects from the Player card arrays).

## Project Demo
The game is currently hosted on Heroku: https://michaeloconnelliii-blackjack.herokuapp.com/

## What is in this repository
* index.html, index,js and style.css are for the game
* index.php and composer.json are for hosting on Heroku

## API Information
* See <a href="https://deckofcardsapi.com/">Deck of Cards API</a> .