// public/js/hotelDetails.js

document.addEventListener("DOMContentLoaded", () => {
  const reserveButtons = document.querySelectorAll(".reserve-btn");
  const proceedToPaymentButton = document.getElementById(
    "proceed-to-payment-btn"
  );

  reserveButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const roomId = button.getAttribute("data-room-id");
      const hotelId = button.getAttribute("data-hotel-id");
      const roomPrice = button.getAttribute("data-room-price");
      const period_start = button.getAttribute("data-period_start");
      const period_end = button.getAttribute("data-period_end");
      // const checkIn = document.getElementById('check-in').value;
      // const checkOut = document.getElementById('check-out').value;
      console.log(period_start, period_end);
      const nights = document.getElementById("nights").value;

      // if (!checkIn || !checkOut) {
      //     alert('Please select check-in and check-out dates before reserving a room.');
      //     return;
      // }

      addToCart(roomId, hotelId, roomPrice, nights, period_start, period_end);
    });
  });

  if (proceedToPaymentButton) {
    proceedToPaymentButton.addEventListener("click", proceedToPayment);
  }
});

function addToCart(
  roomId,
  hotelId,
  roomPrice,
  nights,
  period_start,
  period_end
) {
  fetch("/cart/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomId: roomId,
      hotelId: hotelId,
      roomPrice: roomPrice,
      nights: nights,
      period_start: period_start,
      period_end: period_end,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        if (
          confirm(
            "Room added to cart successfully! Do you want to view your cart?"
          )
        ) {
          window.location.href = "/dashboard#cart";
        }
        // You can update the UI here to reflect the change, e.g., update a cart icon
      } else {
        alert(data.message || "Failed to add room to cart. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert(
        "An error occurred while adding the room to the cart. Please check the console for more details and try again."
      );
    });
}

function proceedToPayment() {
  console.log("proceedToPayment function called");

  // Retrieve cart information
  fetch("/cart/info", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((cartInfo) => {
      console.log("Cart info received:", cartInfo);

      // Get the selected payment method
      const paymentMethod = document.querySelector(
        'input[name="paymentMethod"]:checked'
      ).value;
      console.log("Selected payment method:", paymentMethod);

      const requestBody = {
        hotelName: cartInfo.hotelName,
        roomName: cartInfo.roomName,
        checkIn: cartInfo.checkIn,
        checkOut: cartInfo.checkOut,
        nights: cartInfo.nights,
        amount: cartInfo.totalPrice,
        paymentMethod: paymentMethod,
        cartItemId: cartInfo.cartItemId,
      };

      console.log("Request body for purchase creation:", requestBody);

      // Create a new purchase
      return fetch("/booking/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Purchase creation response:", data);
      if (data.success) {
        alert("Purchase created successfully! Redirecting to payment page...");
        window.location.href = "/payment/" + data.purchaseId;
      } else {
        alert(data.message || "Failed to create purchase. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert(
        "An error occurred while processing your payment. Please check the console for more details and try again."
      );
    });
}
