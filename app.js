let categories = [];

async function getCategoryIds() {
    try {
      const response = await axios.get('https://rithm-jeopardy.herokuapp.com/api/categories?count=100');
      const categoryIds = response.data.map(category => category.id);
      return categoryIds;
    } catch (error) {
      console.error('Error fetching category IDs:', error);
      return [];
    }
  }
//This function accesses all of the categories from the API and returns an error if it is unsuccessful.

async function getCategory(catId) {
  try {
      const response = await axios.get(`https://rithm-jeopardy.herokuapp.com/api/category?id=${catId}`);
      if (!response.data || !response.data.clues) {
          console.error(`Category with ID ${catId} has no clues.`);
          return null;
      }
      const categoryData = {
          title: response.data.title,
          clues: response.data.clues.map(clue => ({
              question: clue.question,
              answer: clue.answer,
              showing: null
          }))
      };
      return categoryData;
  } catch (error) {
      console.error(`Error fetching category with ID ${catId}:`, error);
      return null;
  }
}
//This function helps us map the questions and answers on the jeopardy board, and accesses the random categories from the library. It can return null if the category data or the clues aren't defined.

async function fillTable() {
    const tableHead = document.querySelector('thead tr');
    const tableBody = document.querySelector('tbody');
    tableHead.innerHTML = ''; 
    // Setting this to '' clears the existing table header

    let categoryIds = [];
    try {
        categoryIds = await getCategoryIds();
    } catch (error) {
        console.error('Error fetching category IDs:', error);
        return;
    }
    if (!categoryIds || categoryIds.length === 0) {
        console.error('No category IDs fetched.');
        return;
    }
    //This helps us fetch the category IDs. It will stop the execution if there is either an error fetching the IDs, or if there aren't any IDs being fetched.

    const selectedCategories = []; // Array to store selected category IDs

    for (let i = 0; i < 6; i++) {
        let catId;
        do {
            catId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
        } while (selectedCategories.includes(catId)); // Keep selecting until a unique category ID is found

        selectedCategories.push(catId); // Add the selected category ID to the array

        const category = await getCategory(catId);
        if (category) {
            const th = document.createElement('th');
            th.textContent = category.title;
            tableHead.appendChild(th);
            categories.push(category);
        }
    }
    //This helps us fill the 6 category <thead> with the names of each category. It uses a for loop that adds the category to the table up until 6 are loaded. It also filters out repeated categories.

    for (let i = 0; i < 5; i++) {
      const tr = document.createElement('tr');
      for (let j = 0; j < 6; j++) {
        const td = document.createElement('td');
        td.textContent = '?';
        td.addEventListener('click', clickCell);
        tr.appendChild(td);
      }
      tableBody.appendChild(tr);
    }
    //This fills the table body with the cells for the questions and answers. The for loop accesses 5 since the first cell in each column is reserved for the category name. 
  }

function clickCell(e) {
  const cell = e.target;
  const rowIndex = cell.parentNode.rowIndex - 2; //We use -2 here to account for the array index starting at 0, and the table head not counting for questions. This hard-coding is not best practice but it fixes the current issue.
  const columnIndex = cell.cellIndex;
  const category = categories[columnIndex];

  if (!category || !category.clues) {
    console.error('Invalid category or clues are undefined');
    return;
  }
  if (rowIndex < 0 || rowIndex > category.clues.length) {
    console.error('Invalid row index');
    return;
  }
  
  const clue = category.clues[rowIndex];
  if (!clue) {
    console.error('Clue is undefined');
    return;
  }

 
  if (!clue.showing) {
    cell.textContent = clue.question;
    clue.showing = 'question';
    cell.classList.add('clicked');
  } else if (clue.showing === 'question') {
  //   cell.textContent = '';
  //   clue.showing = 'hidden';
  //   cell.classList.remove('clicked');
  // } else if (clue.showing === 'hidden') {
    cell.textContent = clue.answer;
    clue.showing = 'answer';
    cell.classList.add('answer');
  } else {
    return;
  }
} // The logic that should be followed is: if the default is showing, click the box to show the question. if the question is showing, click the box to reveal the answer. if the answer is showing, do nothing. currently, what is happening is we go from ? to blank on the first click, and blank to the answer on the second click. we need to see ? to question on click 1, and question to answer on click 2.

  function showLoadingView() {
    const spinner = document.querySelector('#spin-container');
    spinner.style.display = 'block';
  }
  //This just displays a spinner while everything is loading.

  function hideLoadingView() {
    const spinner = document.querySelector('#spin-container');
    spinner.style.display = 'none';
  }
  //This hides the spinner after the content is loaded.

async function startAndRestart() {
  const startButton = document.getElementById('start');
    if (startButton.textContent === 'Start!'){
      showLoadingView();
      categories = [];
      try {
        await fillTable();
        hideLoadingView();
        startButton.textContent = 'New Board';
      } catch (error) {
        console.error('Error setting up and starting the game:', error);
        hideLoadingView();
      }
    } else if (startButton.textContent === 'New Board') {
      location.reload();
    }
  }
  //This function uses a start button to access categories from the library and places them in the table head. The spinner starts, the content is loaded, and the spinner goes away. Then the start button switches to a New Board button, and clicking New Board completely reloads the page and doesn't save anything.

document.getElementById('start').addEventListener('click', startAndRestart);

//This last section handles all of the starting and restarting clicks, as well as any clicks within the game board.