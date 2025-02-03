
  document.addEventListener("DOMContentLoaded", function() {
    const roomInput = document.getElementById('roomInput');
const roomValue = document.getElementById('roomValue');
const decreaseRoom = document.getElementById('decreaseRoom');
const increaseRoom = document.getElementById('increaseRoom');

  const adultsInput = document.getElementById('adultsInput');
const adultsValue = document.getElementById('adultsValue');
const decreaseAdults = document.getElementById('decreaseAdults');
const increaseAdults = document.getElementById('increaseAdults');

  const childInput = document.getElementById('childInput');
const childValue = document.getElementById('childValue');
const decreaseChild = document.getElementById('decreaseChild');
const increaseChild = document.getElementById('increaseChild');


increaseRoom.addEventListener('click', () => {
  let currentValue = parseInt(roomInput.value, 10);
  roomInput.value = currentValue + 1;
  roomValue.textContent = currentValue + 1;
});


decreaseRoom.addEventListener('click', () => {
  let currentValue = parseInt(roomInput.value, 10);
  if (currentValue > 1) {
    roomInput.value = currentValue - 1;
    roomValue.textContent = currentValue - 1;
  }
});

increaseAdults.addEventListener('click', () => {
  let currentValue = parseInt(adultsInput.value, 10);
  adultsInput.value = currentValue + 1;
  adultsValue.textContent = currentValue + 1;
});


decreaseAdults.addEventListener('click', () => {
  let currentValue = parseInt(adultsInput.value, 10);
  if (currentValue > 1) {
    adultsInput.value = currentValue - 1;
    adultsValue.textContent = currentValue - 1;
  }
});

increaseChild.addEventListener('click', () => {
  let currentValue = parseInt(childInput.value, 10);
  childInput.value = currentValue + 1;
  childValue.textContent = currentValue + 1;
});

decreaseChild.addEventListener('click', () => {
  let currentValue = parseInt(childInput.value, 10);
  if (currentValue > 0) {
    childInput.value = currentValue - 1;
    childValue.textContent = currentValue - 1;
  }
});
});
