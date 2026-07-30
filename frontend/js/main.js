const appointmentForm = document.getElementById("appointmentForm");

if (appointmentForm) {

    appointmentForm.addEventListener("submit", async function(e) {

        e.preventDefault();

        const appointmentData = {
            fullName: document.getElementById("fullName").value,
            phone: document.getElementById("phone").value,
            email: document.getElementById("email").value,
            department: document.getElementById("department").value,
            date: document.getElementById("date").value,
            message: document.getElementById("message").value
        };


        const response = await fetch(
            "http://localhost:5000/api/appointments",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(appointmentData)
            }
        );


        const result = await response.json();

        alert(result.message);

        appointmentForm.reset();

    });

}

// ================================
// CONTACT FORM
// ================================

const contactForm = document.getElementById("contactForm");

if (contactForm) {

    const contactStatusBox = document.getElementById("contactStatus");

    contactForm.addEventListener("submit", async function(e) {

        e.preventDefault();

        if (contactStatusBox) contactStatusBox.textContent = "Sending...";

        const contactData = {
            name: document.getElementById("cName").value,
            email: document.getElementById("cEmail").value,
            subject: document.getElementById("cSubject").value,
            message: document.getElementById("cMessage").value
        };

        try {

            const response = await fetch(
                "http://localhost:5000/api/contact",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(contactData)
                }
            );

            const result = await response.json();

            if (result.error) {
                if (contactStatusBox) contactStatusBox.textContent = result.error;
                else alert(result.error);
                return;
            }

            if (contactStatusBox) contactStatusBox.textContent = "Message sent successfully!";
            else alert("Message sent successfully!");

            contactForm.reset();

        } catch (err) {
            console.error(err);
            if (contactStatusBox) contactStatusBox.textContent = "Unable to reach the server. Please try again.";
        }

    });

}

// ================================
// DONATE FORM
// ================================

const donateForm = document.getElementById("donateForm");

if (donateForm) {

    const amountInput = document.getElementById("donateAmountInput");
    const statusBox = document.getElementById("donateStatus");
    const amountChips = document.querySelectorAll(".donate-amount-chips button[data-amount]");

    amountChips.forEach((chip) => {
        chip.addEventListener("click", function() {
            amountInput.value = chip.getAttribute("data-amount");
        });
    });

    donateForm.addEventListener("submit", async function(e) {

        e.preventDefault();

        if (statusBox) statusBox.textContent = "Processing...";

        const anonymousCheckbox = donateForm.querySelector('input[name="anonymous"]');

        const donationData = {
            donorName: document.getElementById("donorName").value,
            donorEmail: document.getElementById("donorEmail").value,
            donorPhone: document.getElementById("donorPhone").value,
            amount: amountInput.value,
            anonymous: anonymousCheckbox ? anonymousCheckbox.checked : false
        };

        try {

            const response = await fetch(
                "http://localhost:5000/api/donations",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(donationData)
                }
            );

            const result = await response.json();

            if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
                return;
            }

            if (result.error) {
                if (statusBox) statusBox.textContent = result.error;
                else alert(result.error);
                return;
            }

            if (statusBox) statusBox.textContent = "Thank you for your donation!";
            else alert("Thank you for your donation!");

            donateForm.reset();

        } catch (err) {
            console.error(err);
            if (statusBox) statusBox.textContent = "Unable to reach the server. Please try again.";
        }

    });

}


// ================================
// COPY ACCOUNT NUMBER
// ================================

const copyAccountBtn = document.getElementById("copyAccount");

if (copyAccountBtn) {

    copyAccountBtn.addEventListener("click", function() {
        const acctNumber = document.getElementById("acctNumber").textContent;
        navigator.clipboard.writeText(acctNumber);
        copyAccountBtn.textContent = "Copied!";
        setTimeout(() => { copyAccountBtn.textContent = "Copy Number"; }, 2000);
    });

}

// ================================
// LIVE CHAT WIDGET
// ================================

document.addEventListener("chromeReady", function() {

    const chatToggle = document.getElementById("chatToggle");
    const chatWindow  = document.getElementById("chatWindow");
    const chatClose   = document.getElementById("chatClose");
    const chatBody    = document.getElementById("chatBody");
    const chatInput   = document.getElementById("chatInput");
    const chatSend    = document.getElementById("chatSend");

    if (!chatToggle || !chatWindow) return;

    chatToggle.addEventListener("click", function() {
        chatWindow.classList.toggle("open");
        if (chatWindow.classList.contains("open")) {
            chatInput.focus();
        }
    });

    chatClose.addEventListener("click", function() {
        chatWindow.classList.remove("open");
    });

    function addMessage(text, sender) {
        const msg = document.createElement("div");
        msg.className = "chat-msg " + sender;
        msg.textContent = text;
        chatBody.appendChild(msg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    let chatHistory = [];

    async function getBotReply(text) {
        try {
            const response = await fetch("http://localhost:5000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, history: chatHistory }),
            });

            const data = await response.json();

            if (data.error) {
                return data.error;
            }

            return data.reply;

        } catch (err) {
            console.error(err);
            return "Sorry, I'm having trouble connecting right now. Please call +256 700 123 456 for assistance.";
        }
    }

    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, "user");
        chatHistory.push({ sender: "user", text });
        chatInput.value = "";

        const reply = await getBotReply(text);
        addMessage(reply, "bot");
        chatHistory.push({ sender: "bot", text: reply });
    }

    chatSend.addEventListener("click", handleSend);

    chatInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
        }
    });

});