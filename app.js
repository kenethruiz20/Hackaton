const API_URL = "http://104.197.103.171:8080";  // Flask backend URL

// Function to load contacts from the API and display them
function loadContacts() {
    fetch(`${API_URL}/contacts`)
    .then(response => response.json())
    .then(contacts => {
        const contactList = document.getElementById("contact-list");
        contactList.innerHTML = "";  // Clear the list
        contacts.forEach(contact => {
            const li = document.createElement("li");
            li.classList.add("list-group-item");
            li.innerHTML = `
                <strong>${contact.name}</strong> - ${contact.phone} - ${contact.email}
                <button class="btn btn-danger btn-sm float-right" onclick="deleteContact(${contact.id})">Delete</button>
                <button class="btn btn-secondary btn-sm float-right" onclick="editContact(${contact.id}, '${contact.name}', '${contact.phone}', '${contact.email}')">Edit</button>
            `;
            contactList.appendChild(li);
        });
    })
    .catch(error => {
        console.error("Error loading contacts:", error);
        alert("Error loading contacts.");
    });
}

// Function to add a new contact
function addContact() {
    const name = document.getElementById("contact-name").value;
    const phone = document.getElementById("contact-phone").value;
    const email = document.getElementById("contact-email").value;

    // Create a contact object to send to the API
    const contactData = {
        name: name,
        phone: phone,
        email: email
    };

    // Send POST request to add a new contact
    fetch(`${API_URL}/contacts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(contactData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to add contact.");
        }
        return response.json();
    })
    .then(data => {
        alert("Contact added successfully!");
        loadContacts();  // Reload contacts after adding
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Error adding contact. Please try again.");
    });
}

// Function to delete a contact
function deleteContact(contactId) {
    fetch(`${API_URL}/contacts/${contactId}`, {
        method: "DELETE"
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to delete contact.");
        }
        return response.json();
    })
    .then(data => {
        alert("Contact deleted successfully!");
        loadContacts();  // Reload contacts after deleting
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Error deleting contact. Please try again.");
    });
}

// Function to edit a contact
function editContact(contactId, name, phone, email) {
    document.getElementById("contact-name").value = name;
    document.getElementById("contact-phone").value = phone;
    document.getElementById("contact-email").value = email;
    document.getElementById("contact-id").value = contactId;
    document.getElementById("submit-button").textContent = "Update Contact";
}

// Function to update a contact
function updateContact(contactId) {
    const name = document.getElementById("contact-name").value;
    const phone = document.getElementById("contact-phone").value;
    const email = document.getElementById("contact-email").value;

    const contactData = {
        name: name,
        phone: phone,
        email: email
    };

    fetch(`${API_URL}/contacts/${contactId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(contactData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to update contact.");
        }
        return response.json();
    })
    .then(data => {
        alert("Contact updated successfully!");
        loadContacts();
        clearForm();
    })
    .catch(error => {
        console.error("Error updating contact:", error);
        alert("Error updating contact. Please try again.");
    });
}

// Function to handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    const contactId = document.getElementById("contact-id").value;
    if (contactId) {
        updateContact(contactId);
    } else {
        addContact();
    }
}

// Function to clear the form after updating
function clearForm() {
    document.getElementById("contact-name").value = "";
    document.getElementById("contact-phone").value = "";
    document.getElementById("contact-email").value = "";
    document.getElementById("contact-id").value = "";
    document.getElementById("submit-button").textContent = "Add Contact";
}

// Load contacts on page load
window.onload = loadContacts;
