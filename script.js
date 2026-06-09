const button = document.getElementById("increaseBtn")

const countText = document.getElementById("count")

let count = 0

button.addEventListener("click", function () {

    count = count + 1

    countText.innerText = count

})