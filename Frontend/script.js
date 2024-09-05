
console.log('script is loaded');
//currentPage: Tracks the current page number for pagination (starts at 1).
let currentPage = 1;
const limit = 20; // Number of users per page
let allUsers = []; // Stores all fetched user
async function fetchUsers(page = 1) {
    console.log('fetchUsers');
    try {
        const response = await fetch(`http://localhost:8003/users?page=${page}&limit=${limit}`);
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched data:', data);

        // Extract total pages from response headers or response body
        const totalPages = parseInt(response.headers.get('total-pages')) || 5; // Adjust if your API uses a different header or structure
console.log('totalPages', totalPages)
        if (Array.isArray(data)) {
            console.log('Fetched users:', data);

            allUsers = data; // Store fetched users globally
            displayUsers(data); // Display users in the table

            currentPage = page; // Update the current page after data is fetched
            updatePagination(totalPages); // Update pagination logic with total pages
        } else {
            console.error('Data is not an array:', data);
        }
    } catch (error) {
        console.error('User not found:', error);
    }
}

// Function to display users in the table
function displayUsers(users) {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user._id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
        `;
        tableBody.appendChild(row);
    });
}
// // Function to filter users based on search input
function filterUsers() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
//filter: Iterates over each user in the allUsers array.
//includes: Checks if username, email, or phone
    const filteredUsers = allUsers.filter(user => {
        return user.username.toLowerCase().includes(searchInput) ||
            user.email.toLowerCase().includes(searchInput) ||
            user.phone.includes(searchInput); 
    });

    displayUsers(filteredUsers);
}
// Function to update pagination
function updatePagination(totalPages) {
    
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.disabled = i === currentPage; // Disable button for the current page
        button.addEventListener('click', () => fetchUsers(i));
        pagination.appendChild(button);
    }
}
// Function to generate data
async function generateData() {
    console.log('generateData');
    console.time('generateData'); // Start timing
    try {
        const response = await fetch('http://localhost:8003/populate', {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error('Failed to generate data');
        }
        // Fetch users after generating new data
        await fetchUsers();
        console.timeEnd('generateData'); // End timing
    } catch (error) {
        console.log('Error generating data:', error);
    }
}
// Function to delete all users in batches
async function deleteAllUsers() {
    console.log('Delete button clicked');
    console.time('deleteAllUsers'); // Start timing
    try {
        const response = await fetch('http://localhost:8003/deleteAll', {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to delete users');
        }
        // Fetch users after deletion
        await fetchUsers(currentPage); // Fetch users with the current page number
        console.timeEnd('deleteAllUsers'); // End timing
    } catch (error) {
        console.log('Error deleting users:', error);
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchUsers(); // Fetch users for the initial page load
    document.getElementById('generateButton').addEventListener('click', generateData);
    document.getElementById('DeleteButton').addEventListener('click', deleteAllUsers);
    document.getElementById('searchInput').addEventListener('input', filterUsers); // Add search input listener
});








