document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select so we don't duplicate options on refresh
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build inner HTML and include an availability span we can update later
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="availability">${spotsLeft}</span> spots left</p>
        `;

        // Participants header
        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants:";
        activityCard.appendChild(participantsHeader);

        // Participants list (bulleted)
        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (!details.participants || details.participants.length === 0) {
          const li = document.createElement("li");
          li.className = "no-participants";
          li.textContent = "No participants yet.";
          participantsList.appendChild(li);
        } else {
          const maxShow = 5;
          details.participants.slice(0, maxShow).forEach(participant => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = participant;

            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-participant-btn";
            removeBtn.setAttribute("aria-label", `Remove ${participant}`);
            removeBtn.type = "button";
            removeBtn.textContent = "✖";

            // Attach unregister action
            removeBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(participant)}`,
                  { method: "POST" }
                );

                const result = await res.json();
                if (res.ok) {
                  // remove from DOM
                  li.remove();

                  // update availability number
                  const avail = activityCard.querySelector(".availability");
                  if (avail) {
                    const current = parseInt(avail.textContent || "0", 10);
                    avail.textContent = String(current + 1);
                  }
                } else {
                  console.error("Failed to unregister:", result.detail || result);
                }
              } catch (err) {
                console.error("Error unregistering participant:", err);
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(removeBtn);
            participantsList.appendChild(li);
          });

          if (details.participants.length > maxShow) {
            const moreLi = document.createElement("li");
            moreLi.className = "participant-more";
            moreLi.textContent = `and ${details.participants.length - maxShow} more...`;
            participantsList.appendChild(moreLi);
          }
        }

        activityCard.appendChild(participantsList);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities view so new participant appears immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
