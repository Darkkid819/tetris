document.addEventListener("DOMContentLoaded", function() {
    console.log("Tetris game loaded!");

    const startButton = document.getElementById('startButton');
    startButton.addEventListener('click', startGame);
});

function startGame() {
    // Hide the start button after clicking
    document.getElementById('startButton').style.display = 'none';

    startTetrisGameLoop();
}