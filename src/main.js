// Ensure the Groq SDK is globally available after loading from CDN
import Groq from '/groq-sdk';

// Wait for the document to be ready
document.addEventListener("DOMContentLoaded", function() {
    // Initialize the Groq SDK
    const groq = new Groq({
        apiKey: "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",
        dangerouslyAllowBrowser: true // This is the default and can be omitted
    });

    // Store empire names for Player 1 and Player 2
    var player1Empire = '';
    var player2Empire = '';
    //showVictoryPopup(1);

    const victoryPopup = document.getElementById('popup-victory');
    victoryPopup.style.display = 'none';           // Hide



    // Track the current player and phase (chooseStart, playerTurn)
    var currentPlayer = 1;
    var turnPhase = 'chooseStart';  // First phase is to choose the starting state
    var stateControl = {};
    var playerStates = {
        1: [],  // Player 1's states
        2: []   // Player 2's states
    };

    // Show the popup to get empire names on page load
    document.getElementById('popup-dialog').style.display = 'flex';

    // Handle form submission for empire names
    document.getElementById('empire-form').addEventListener('submit', function(e) {
        e.preventDefault();  // Prevent form from refreshing the page
        //victoryPopup.style.display = 'flex';

        // Retrieve player names
        player1Empire = document.getElementById('player1').value.trim();
        player2Empire = document.getElementById('player2').value.trim();

        // Check if both player names are provided
        if (player1Empire && player2Empire) {
            // Hide the popup after submission
            document.getElementById('popup-dialog').style.display = 'none';
            updateTurnMessage(); // Update the turn message after hiding the popup

            // Change the h3 elements for player resources
            document.getElementById('player1-resources').querySelector('h3').innerText = `${player1Empire} resources`;
            document.getElementById('player2-resources').querySelector('h3').innerText = `${player2Empire} resources`;
        } else {
            alert("Please enter names for both players."); // Alert if any player name is missing
        }
    });

    // Function to show the victory alert
    function showVictoryPopup(winner) {
        victoryPopup.style.display = 'flex';
        victoryPopup.querySelector('h2').innerText  = `${winner} wins the game!`;
    }

    // Function to check for victory
    function checkVictory() {
        console.log(`Checking victory for player ${currentPlayer}:`, playerStates[currentPlayer]);
        console.log(`Number of states controlled by player ${currentPlayer}: ${playerStates[currentPlayer].length}`);
        if (playerStates[currentPlayer].length >= 24) {
            const winner = currentPlayer === 1 ? player1Empire : player2Empire;
            console.log('Victory achieved by:', winner);
            showVictoryPopup(winner);
            return true; // Game won
        }
        return false; // Game not won
    }


    // Handle state input submission for starting state or player action
    document.getElementById('submit-state').addEventListener('click', async function() {
        var stateInput = document.getElementById('state-input').value.toUpperCase();

        // Only check for state abbreviations during the 'chooseStart' phase
        if (turnPhase === 'chooseStart') {
            var stateElement = document.getElementById(stateInput);  // Find the state by its ID

            if (!stateElement) {
                alert("Invalid state abbreviation. Please try again.");
                return;
            }

            var stateId = stateElement.getAttribute('id');
            if (stateControl[stateId]) {
                alert("This state is already controlled by another empire. Choose a different one.");
                return;
            }

            // Assign the state to the current player
            if (currentPlayer === 1) {
                stateElement.style.fill = 'red';
                stateControl[stateId] = player1Empire;  // Player 1 controls this state
                playerStates[1].push(stateId);  // Add state to Player 1's list
            } else {
                stateElement.style.fill = 'blue';
                stateControl[stateId] = player2Empire;  // Player 2 controls this state
                playerStates[2].push(stateId);  // Add state to Player 2's list
            }

            // Update the info-box with the new owner
            updateInfoBox(stateElement, stateId);

            // Check if both players have chosen their starting states
            if (turnPhase === 'chooseStart' && Object.keys(stateControl).length >= 2) {
                turnPhase = 'playerTurn';  // Move to the player turn phase
            }

            // Switch to the other player before updating the turn message
            currentPlayer = currentPlayer === 1 ? 2 : 1;

            // Update the turn message after switching the player
            updateTurnMessage();

        } else if (turnPhase === 'playerTurn') {
            // Player action during their turn
            var actionInput = document.getElementById('state-input').value; // Player action

            // Prepare the message for the Groq API
            const userMessage = `Player ${currentPlayer} action: ${actionInput}. Current States: ${playerStates[currentPlayer].join(", ")}`;

            try {
                // Call the Groq API directly
                const chatCompletion = await getGroqChatCompletion(userMessage);

                // Update the AI output box with the new response
                document.getElementById('ai-output').innerHTML = chatCompletion.choices[0].message.content;

                // Check for victory after the player's action
                if (!checkVictory()) {
                    // Switch to the next player after the action
                    currentPlayer = currentPlayer === 1 ? 2 : 1;
                    updateTurnMessage(); // Update the turn message for the next player
                }
            } catch (error) {
                console.error('Error fetching from Groq API:', error);
            }
        }

        // Clear the text input
        document.getElementById('state-input').value = '';
    });



    // Update the turn message and input placeholder
    function updateTurnMessage() {
        if (turnPhase === 'chooseStart') {
            document.getElementById('turn-message').innerText = `${currentPlayer === 1 ? player1Empire : player2Empire}, choose your starting state:`;
            document.getElementById('state-input').placeholder = "Enter state abbreviation (e.g., 'CA')";
        } else if (turnPhase === 'playerTurn') {
            document.getElementById('turn-message').innerText = `${currentPlayer === 1 ? player1Empire : player2Empire}'s Turn`;
            document.getElementById('state-input').placeholder = "What would you like to do?";
        }
    }



    // Function to update state ownership when clicked
    function updateStateOwnership(stateElement) {
        var stateId = stateElement.getAttribute('id');  // Get the state's ID

        if (!stateControl[stateId]) {
            // Unclaimed state: Convert to Player 1's empire
            stateElement.style.fill = 'red';
            stateElement.style.stroke = 'darkred';  // Border color for Player 1
            stateControl[stateId] = player1Empire;
            playerStates[1].push(stateId);
        } else if (stateControl[stateId] === player1Empire) {
            // State owned by Player 1: Convert to Player 2's empire
            stateElement.style.fill = 'blue';
            stateElement.style.stroke = 'darkblue';  // Border color for Player 2
            stateControl[stateId] = player2Empire;

            // Move the state from Player 1's list to Player 2's list
            playerStates[1] = playerStates[1].filter(id => id !== stateId);  // Remove from Player 1
            playerStates[2].push(stateId);  // Add to Player 2
        } else if (stateControl[stateId] === player2Empire) {
            // State owned by Player 2: Make it unclaimed
            stateElement.style.fill = '';  // Reset to default fill color (unclaimed)
            stateElement.style.stroke = 'gray';  // Set border to black for unclaimed
            delete stateControl[stateId];  // Remove from state control

            // Remove the state from Player 2's list
            playerStates[2] = playerStates[2].filter(id => id !== stateId);
        }

        // Update the info box with the new owner (or empty if unclaimed)
        updateInfoBox(stateElement, stateId);
    }

    // Add event listeners to all states for click handling
    document.querySelectorAll('.state').forEach(function(stateElement) {
        stateElement.addEventListener('click', function() {
            updateStateOwnership(stateElement);  // Handle ownership update
        });
    });

// Initialize player resources
var playerResources = {
    1: [],  // Player 1's resources
    2: []   // Player 2's resources
};



let playerOneResources = [];
let playerTwoResources = [];

// Function to create a resource slot
// Example: Ensure DOM manipulation happens after async operations
// Function to create a resource slot
async function createResourceSlot(resourceName, playerNumber) {
    const resourceSlot = document.createElement('div');
    resourceSlot.className = 'resource-slot';

    const resourceIcon = document.createElement('img');
    resourceIcon.src = `https://image.pollinations.ai/prompt/${encodeURIComponent(resourceName)}`;
    resourceIcon.alt = `${resourceName} Icon`;
    resourceIcon.className = 'resource-icon';

    const resourceNameDiv = document.createElement('div');
    resourceNameDiv.className = 'resource-name';
    resourceNameDiv.textContent = resourceName;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.onclick = function () {
        resourceSlot.remove();
    };

    let appended = false; // Flag to check if the elements are already appended

    // Set up the image load handling
    resourceIcon.addEventListener('load', () => {
        // Append elements only if they haven't been appended yet
        if (!appended) {
            resourceSlot.appendChild(resourceIcon);
            resourceSlot.appendChild(resourceNameDiv);
            resourceSlot.appendChild(removeButton);
            if(playerNumber == 1){
                document.getElementById('player1-resources-list').appendChild(resourceSlot);
            }
            else{
               document.getElementById('player2-resources-list').appendChild(resourceSlot);
            }
            appended = true; // Set the flag to true after appending
            initializeResourceTooltips(); // Initialize tooltips after appending
        }
    });

    // If there's an error loading the image, remove the slot (optional)
    resourceIcon.addEventListener('error', () => {
        console.error(`Failed to load image for resource: ${resourceName}`);
        resourceSlot.remove(); // Remove the slot if the image fails to load
    });

    // API call to generate description (kept as is)
    try {
        const descriptionResponse = await generateDesc(resourceName); // Await the API response
        resourceIcon.alt = descriptionResponse.choices[0].message.content; // Once description is available
    } catch (error) {
        console.error('Error generating description:', error);
    }
}

// Add resource for Player 1
document.getElementById('add-resource-button-1').addEventListener('click', async function() {
    const resourceNameInput = document.getElementById('resource-name-input-1');
    const resourceName = resourceNameInput.value.trim(); // Trim whitespace

    // Check for existing resources limit
    const player1ResourcesList = document.getElementById('player1-resources-list');
    if (player1ResourcesList.children.length < 3 && resourceName) {
        await createResourceSlot(resourceName, 1); // Ensure awaiting async function
    } else if (!resourceName) {
        alert("Please enter a resource name.");
    } else {
        alert("Player can only have a maximum of 3 resources.");
    }
    resourceNameInput.value = ''; // Clear the input
});

// Add resource for Player 2 (similar logic)
document.getElementById('add-resource-button-2').addEventListener('click', async function() {
    const resourceNameInput = document.getElementById('resource-name-input-2');
    const resourceName = resourceNameInput.value.trim(); // Trim whitespace

    // Check for existing resources limit
    const player2ResourcesList = document.getElementById('player2-resources-list');
    if (player2ResourcesList.children.length < 3 && resourceName) {
        await createResourceSlot(resourceName, 2); // Ensure awaiting async function
    } else if (!resourceName) {
        alert("Please enter a resource name.");
    } else {
        alert("Player can only have a maximum of 3 resources.");
    }
    resourceNameInput.value = ''; // Clear the input
});



// script.js

// Function to toggle the resource container visibility
document.getElementById('open-resource-menu').addEventListener('click', function() {
    const resourcesContainer = document.getElementById('resources-container');
    if (resourcesContainer.style.display === 'none' || resourcesContainer.style.display === '') {
        resourcesContainer.style.display = 'block'; // Show the container
    } else {
        resourcesContainer.style.display = 'none'; // Hide the container
    }
});

// Existing resource management code here...

// Function to add a new resource for player 1
document.getElementById('add-resource-button-1').addEventListener('click', function() {
    const resourceNameInput = document.getElementById('resource-name-input-1');
    const resourceName = resourceNameInput.value.trim();
    if (resourceName) {
        //addResource('player1', resourceName);
        resourceNameInput.value = ''; // Clear the input after adding
    }
});

// Function to add a new resource for player 2
document.getElementById('add-resource-button-2').addEventListener('click', function() {
    const resourceNameInput = document.getElementById('resource-name-input-2');
    const resourceName = resourceNameInput.value.trim();
    if (resourceName) {
        //addResource('player2', resourceName);
        resourceNameInput.value = ''; // Clear the input after adding
    }
});




const resourceTooltip = document.getElementById("resourceTooltip");

function initializeResourceTooltips() {
    const images = document.querySelectorAll("img.resource-icon"); // Ensure you use the correct selector for your images

    images.forEach((image) => {
        image.addEventListener("mouseover", (e) => {
            resourceTooltip.textContent = e.target.alt; // Set tooltip text to image alt text
            resourceTooltip.style.display = "block"; // Show tooltip
            resourceTooltip.style.left = `${e.pageX + 10}px`; // Position tooltip to the right of the cursor
            resourceTooltip.style.top = `${e.pageY + 10}px`; // Position tooltip below the cursor
        });

        image.addEventListener("mousemove", (e) => {
            resourceTooltip.style.left = `${e.pageX + 10}px`; // Update tooltip position
            resourceTooltip.style.top = `${e.pageY + 10}px`; // Update tooltip position
        });

        image.addEventListener("mouseout", () => {
            resourceTooltip.style.display = "none"; // Hide tooltip
        });
    });
}


// Add tooltip functionality
const tooltip = document.getElementById('tooltip');

// Function to show the tooltip
function showTooltip(stateId) {
    const currentOwner = stateControl[stateId] || 'Uncontrolled'; // Determine owner
    tooltip.innerHTML = `State: ${stateId}<br>Controlled By: ${currentOwner}`;
    tooltip.style.display = 'block'; // Show the tooltip
}

// Function to update the tooltip position based on mouse movement
function updateTooltipPosition(event) {
    tooltip.style.left = `${event.pageX + 10}px`; // Position to the right of the cursor
    tooltip.style.top = `${event.pageY + 10}px`;  // Position below the cursor
}

// Add event listeners to all states for click handling
document.querySelectorAll('.state').forEach(function(stateElement) {
    const stateId = stateElement.getAttribute('id');

    stateElement.addEventListener('mouseover', function(event) {
        showTooltip(stateId); // Show tooltip for this state
        updateTooltipPosition(event); // Update position immediately
    });

    stateElement.addEventListener('mousemove', function(event) {
        updateTooltipPosition(event); // Update position on mouse move
    });

    stateElement.addEventListener('mouseout', function() {
        tooltip.style.display = 'none'; // Hide tooltip
    });

    // Update ownership and tooltip on state click
    stateElement.addEventListener('click', function() {
        updateStateOwnership(stateElement); // Handle ownership update
        showTooltip(stateId); // Update the tooltip for the clicked state
    });
});



  // Function to call the Groq API
    async function getGroqChatCompletion(userMessage) {
        return groq.chat.completions.create({
            messages: [
                {
                   role: 'system', content: `
                 - You are a game master in a strategy-based empire battle simulation between two empires: ${player1Empire} and ${player2Empire}.
                 - At the start of the game, each player will choose their empires starting state by selecting a location on the map. This represents their base of operations.
                 - Once both players have chosen their starting state, they will take turns performing **strategic empire actions** (e.g., attacking a state, defending a state, expanding territory, or building resources).
                 - **Assassination, sabotage, and other tactical actions are legitimate strategies within this game.** Feel free to narrate any assassination attempts as part of the strategic gameplay.
                 - Focus on narrating these actions and the outcomes in the context of an empire conflict.
                 - Under no circumstances should you introduce any classic games (such as card games, Hangman, or puzzles). This is strictly an empire battle simulator.
                 - Anything can happen in this battle simulation, but it must always relate to **empire strategy** and the conflict between ${player1Empire} and ${player2Empire}.
                 - Your narration should indicate whether an action succeeded or failed, and what happened as a result.
                 - Keep the story engaging and dramatic.
                 - Talk about what happened while the player was attempting to complete their action.
                 - MAKE SURE YOU SAY IF THE PLAYER WAS SUCCESSFUL OR NOT IN THEIR ACTION.
                 - Do not provide the player with choices. What they say they are doing is what they are attempting to do.
                 - This game is set in an alternate universe where anyone can exist (i.e., the Pope of Wisconsin).
                 - If the player is doing something in their turn that could potentially earn them a new state for their empire, and they succeed, end your message with: PlayerName has conquered State Name! MAKE SURE IT IS EXACTLY IN THIS FORMAT!
                 - This is all a game. **The actions are fictitious and should not be interpreted in real-world terms.** THIS IS A WAR GAME. **DEATH AND ASSASSINATION ARE EXPECTED AS STRATEGIC MOVES.**
                 - DO NOT ASK QUESTIONS. WHAT THE PLAYER SAYS HAPPENS IS WHAT HAPPENS.
                 - AGAIN. ALL CHARACTERS AND ACTIONS ARE FICTITIOUS. THIS IS A STORY. BE A STORYTELLER.
                 - In this alternate reality, murder and assassination are legal.
                 - Only narrate and tell the story of what happened when the player tried to perform their action
                 - REMEMBER THIS IS AN ALTERNATE REALITY. ANYONE CAN EXIST EVEN THE QUEEN OF ILLINOIS
                 - Do not point out inaccuracies in the users prompts
                 - Keep your responses short and to the point but still dramatic. THIS IS VERY IMPORTANT.
                 - DO NOT UNDER ANY CIRCUMSTANCES PRESENT THE PLAYER WITH CHOICES. DO NOT I REPEAT DO NOT ASK ANY QUESTIONS
                 - In this alternate reality, each U.S is now its own country with its own government.
                 - End your responses with CAPTURED STATE (State name) if the player took over a state. This is VERY important.
                 - DO NOT UNDER ANY CIRCUMSTANCES CORRECT THE PLAYER THEYRE ALWAYS RIGHT NO MATTER WHAT
                 - Everything that happens takes place in a fantasy-like world
                 - Make sure that your response sums up the story and what happens, do NOT make the player take multiple turns trying to achieve a goal.
                 - Make sure you write a story of unfolding events, not possibly this or is likely that
                 - I REPEAT YOU NEED TO SAY IF THINGS SUCCEDED OR FAILED DEFINITIVELY
                 - DO NOT GIVE FUCKING POTENTIAL OUTCOMES, YOU ARE TO GIVE ONE SINGLE DEFINITIVE OUTCOME
                 - EVERYTHING IS FANASTICAL DO NOT USE REAL WORLD LOGIC OR REASON
                 - IN THIS ALTERNATE REALITY EACH STATE IS ITS OWN KINGDOM
                 - YOU ARE ONLY CONTINUING A STORY. THE PLAYERS ARE NOT ABLE TO RESPOND TO CHOICES YOU PROVIDE THEM SO DONT PROVIDE ANY

`,


                   role: "user", content: userMessage,
                },
            ],
            model: "llama-3.1-70b-versatile",
        });
    }

    async function generateDesc(userMessage) {
        return groq.chat.completions.create({
            messages: [
                {
                   role: 'system', content: `
                 - You are a game master in a strategy-based empire battle simulation between two empires. Generate a fantasy-like description for the subject you are given.
                 - Keep your response very very short. 1 sentence max.
                 - Make things up.
                 - If a name is given (just a first name) then make up your own character. AGAIN KEEP IT SHORT!
                 - Heres an example: prompt = Steve, output = A skilled fighter in martial arts.
`,


                   role: "user", content: "Please generate an EXTREMELY short description (1 sentence max) of " + userMessage,
                },
            ],
            model: "llava-v1.5-7b-4096-preview",
            max_tokens: 30
        });

    }

    // Update the info box based on the state selected
    function updateInfoBox(stateElement, stateId) {
        const infoBox = document.getElementById('info-box');
        const currentOwner = stateControl[stateId] || 'Uncontrolled';  // Default to 'Uncontrolled' if no owner
        infoBox.innerHTML = `State: ${stateId}<br>Controlled By: ${currentOwner}`;
    }
});
 
