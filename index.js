// Close front page on play a round button
let playBtn = document.getElementById('play-btn');
let frontPage = document.getElementById('front-page');

playBtn.addEventListener('click', () => {
    frontPage.classList.add('front-page-hidden');
});