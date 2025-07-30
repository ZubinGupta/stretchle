

var state = {
  secret: '',
  grid: Array(6)
    .fill()
    .map(() => Array(4).fill('')),
  rowLengths: Array(6).fill(4), 
  currentRow: 0,
  currentCol: 0,
};

async function initializeGame() {
  state.secret = await getRandomWordFromFile();
  startup();
}

async function getRandomWordFromFile() {
  const response = await fetch('ans.txt');
  const text = await response.text();
  const words = text.split(/\r?\n/).filter(w => w.length > 0);
  return words[Math.floor(Math.random() * words.length)];
}

function drawBox(container, row, col, letter = '') {
  const box = document.createElement('div');
  box.className = 'box';
  box.textContent = letter;
  box.id = `box${row}${col}`;

  container.appendChild(box);
  return box;
}

function drawGrid(container) {
  const grid = document.createElement('div');
  grid.className = 'grid';

  // Clear previous grid if any
  container.innerHTML = '';

  for (let i = 0; i < 6; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'grid-row';
    // Use the row's current length
    for (let j = 0; j < state.rowLengths[i]; j++) {
      drawBox(rowDiv, i, j, state.grid[i][j]);
    }
    grid.appendChild(rowDiv);
  }
  container.appendChild(grid);
}



function updateGrid() {
  const container = document.getElementById('game');
  const grid = document.createElement('div');
  grid.className = 'grid';

  for (let i = 0; i < 6; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'grid-row';
    for (let j = 0; j < state.rowLengths[i]; j++) {
      const letter = state.grid[i][j];
      const box = document.createElement('div');
      box.className = 'box';
      box.textContent = letter;
      box.id = `box${i}${j}`;

      // For completed rows, preserve status classes if they exist in the old DOM
      const oldBox = document.getElementById(`box${i}${j}`);
      if (oldBox) {
        if (oldBox.classList.contains('right')) box.classList.add('right');
        if (oldBox.classList.contains('wrong')) box.classList.add('wrong');
        if (oldBox.classList.contains('empty')) box.classList.add('empty');
      }

      rowDiv.appendChild(box);
    }
    grid.appendChild(rowDiv);
  }
  container.innerHTML = '';
  container.appendChild(grid);
  selectSpot();
}

function registerKeyboardEvents() {
  document.body.onkeydown = async (e) => {
    const key = e.key;

    // If game is done and Enter is pressed, trigger play again
    if (done && key === 'Enter') {
      const playAgainButton = document.getElementById('playAgainButton');
      if (playAgainButton) {
        playAgainButton.click();
      }
      return; // Prevent further processing
    }

    if (key === 'Enter') {
      const word = getCurrentWord();
      // Only allow guesses between 4 and 9 letters
      if (word.length >= 4 && word.length <= 9 && await isWordValid(word)) {
        revealWord(word); // <-- colors are set here
        state.currentRow++;
        state.currentCol = 0;
        // DO NOT call updateGrid() here!
        return; // Prevent updateGrid() at the end of the handler
      }
    }
    if (key === 'Backspace') {
      if (e.ctrlKey) {
        clearLine();
      }
      else {
        removeLetter();
      }
    }
    if (isLetter(key)) {
      addLetter(key);
    }
    if (key === 'Shift') { 
      if (done) {
        const playAgainButton = document.getElementById('playAgainButton');
        if (playAgainButton) {
          playAgainButton.click();
        }
      }
      reset();
    }
    updateGrid();
    // document.getElementById("hello").innerHTML = `${state.currentRow},${state.currentCol},${srow},${scol}`;
  };
}

function selectSpot() {
  document.getElementById(`box${srow}${scol}`)?.classList.remove("select");
  srow = state.currentRow;
  if (state.currentCol != state.secret.length) { // <-- use secret length
    scol = state.currentCol;
    document.getElementById(`box${srow}${scol}`)?.classList.add("select");
  }
}

function getCurrentWord() {
  // Use all letters typed in the current row
  return state.grid[state.currentRow].slice(0, state.currentCol).join('');
}

async function isWordValid(word) {
  if (!window.guessWords) {
    const response = await fetch('guess.txt');
    const text = await response.text();
    window.guessWords = new Set(text.split(/\r?\n/).filter(w => w.length > 0));
  }
  return window.guessWords.has(word);
}

function getNumOfOccurrencesInWord(word, letter) {
  let result = 0;
  for (let i = 0; i < word.length; i++) {
    if (word[i] === letter) {
      result++;
    }
  }
  return result;
}

function getPositionOfOccurrence(word, letter, position) {
  let result = 0;
  for (let i = 0; i <= position; i++) {
    if (word[i] === letter) {
      result++;
    }
  }
  return result;
}

function isLetter(key) {
  return key.length === 1 && key.match(/[a-z]/i);
}

function addLetter(letter) {
  const row = state.currentRow;
  // Grow the row if needed, up to 9
  if (state.currentCol === state.rowLengths[row] && state.rowLengths[row] < 9) {
    state.grid[row].push('');
    state.rowLengths[row]++;
    updateGrid(); // Redraw to add the new box
  }
  if (state.currentCol === state.rowLengths[row]) return; // Don't go past 9
  state.grid[row][state.currentCol] = letter;
  state.currentCol++;
}

function removeLetter() {
  const row = state.currentRow;
  if (state.currentCol === 0) return;
  state.grid[row][state.currentCol - 1] = '';
  state.currentCol--;

  // If the row has more than 4 boxes and the last box is now empty, remove it
  if (state.rowLengths[row] > 4 && state.currentCol === state.rowLengths[row] - 1) {
    state.grid[row].pop();
    state.rowLengths[row]--;
    updateGrid(); // Redraw to remove the box
  }
}

function startup() {
  document.getElementById("hello").innerText = "Have fun!";
  const game = document.getElementById('game');
  drawGrid(game);

  registerKeyboardEvents();
  // state.secret = "hello";

  

  reset();
}

async function reset() {
  document.getElementById("hello").innerText = "Have fun!"; // Reset the top text
  state.secret = await getRandomWordFromFile();
  done = false;
  state.grid = Array(6)
    .fill()
    .map(() => Array(4).fill(''));
  state.rowLengths = Array(6).fill(4); // Track length of each row
  state.currentRow = 0;
  state.currentCol = 0;

  // Redraw the grid with the correct number of columns
  const game = document.getElementById('game');
  drawGrid(game);

  updateGrid();
}

function revealWord(guess) {
  const row = state.currentRow;
  const secret = state.secret;
  const guessArr = guess.split('');
  const secretArr = secret.split('');
  const green = Array(guessArr.length).fill(false);

  const secretCount = Array(26).fill(0);

  // First pass: mark greens and count secret letters
  for (let i = 0; i < guessArr.length; i++) {
    const box = document.getElementById(`box${row}${i}`);
    setBoxStatus(box, ''); // Remove old status
    if (i < secretArr.length && guessArr[i] === secretArr[i]) {
      setBoxStatus(box, 'right');
      green[i] = true;
    }
    if (i < secretArr.length) {
      secretCount[secretArr[i].charCodeAt(0) - 97]++;
    }
  }

  const yellowUsed = Array(26).fill(0);

  // Second pass: mark yellows and grays
  for (let i = 0; i < guessArr.length; i++) {
    const box = document.getElementById(`box${row}${i}`);
    if (green[i]) continue;

    const idx = guessArr[i].charCodeAt(0) - 97;

    // Count how many times this letter has already been marked green or yellow
    // (for the whole answer, not just up to guess length)
    const alreadyMarked =
      yellowUsed[idx] +
      guessArr.filter(
        (l, j) => l === guessArr[i] && green[j] && secretArr[j] === guessArr[i]
      ).length;

    if (
      secretArr.includes(guessArr[i]) &&
      alreadyMarked < secretArr.filter(l => l === guessArr[i]).length
    ) {
      setBoxStatus(box, 'wrong');
      yellowUsed[idx]++;
    } else {
      setBoxStatus(box, 'empty');
    }
  }

  const isWinner = state.secret === guess;
  const isGameOver = state.currentRow === 5;

  if (isWinner) {
    document.getElementById("hello").innerText = "Congratulations! You got it!";
    done = true;
  } else if (isGameOver) {
    document.getElementById("hello").innerText = "Better luck next time! The word was " + state.secret + ".";
    done = true;
  }
  if (done) {
    const playAgainButton = document.createElement('button');
    playAgainButton.id = 'playAgainButton';
    playAgainButton.textContent = 'Again?';
    playAgainButton.addEventListener('click', function () {
      playAgainButton.remove();
      reset();
    });
    document.body.appendChild(playAgainButton);
  }
}

function setBoxStatus(box, status) {
  box.classList.remove('right', 'wrong', 'empty');
  if (status) box.classList.add(status);
  console.log("Setting box status:", box.id, status);
}

// document.querySelector('.grid').style.setProperty('--word-length', state.secret.length);
initializeGame();

var srow = 0;
var scol = 0;
var position;