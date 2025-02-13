// public/scripts/auth.js
function showAuthPopup() {
  document.getElementById("authPopup").style.display = "flex";
}

function closePopup() {
  document.getElementById("authPopup").style.display = "none";
}

function toggleUserMenu() {
  console.log("toggle user menu");
  const userMenu = document.getElementById("userMenu");
  userMenu.classList.toggle("show");
}

// 메뉴 외부를 클릭하면 메뉴를 닫습니다.
document.addEventListener("click", function (event) {
  const userMenu = document.getElementById("userMenu");
  const userDropdown = document.querySelector(".user-dropdown");

  if (userDropdown && !userDropdown.contains(event.target)) {
    userMenu.classList.remove("show");
  }
});

document.getElementById("email").addEventListener("blur", function () {
  const email = this.value;
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPWD");
  const authButton = document.getElementById("authButton");
  const authForm = document.getElementById("authForm");
  const emailError = document.getElementById("emailError");

  fetch(`/auth/check-email?email=${encodeURIComponent(email)}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        emailError.textContent = data.error;
        emailError.style.display = "block";
      } else if (data.exists) {
        // 이메일이 존재하면 비밀번호 필드를 보여주고 버튼 텍스트를 변경
        passwordInput.style.display = "block";
        authButton.textContent = "login";
        document.getElementById("authForm").action = "/auth/login"; // 로그인 라우트로 변경
      } else {
        // 이메일이 존재하지 않으면 비밀번호 필드를 숨기고 버튼 텍스트를 변경
        this.style.display = "none";
        passwordInput.style.display = "block";
        confirmInput.style.display = "block";

        authButton.textContent = "register";
        document.getElementById("authForm").action = "/auth/register"; // 회원가입 라우트로 변경
      }
    })
    .catch((error) => console.error("Error:", error));
});

document
  .getElementById("authForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const authButton = document.getElementById("authButton");
    

    if (authButton.textContent === "register") {
      const confirm = document.getElementById("confirmPWD").value;
      const errorConfirmPWD = document.getElementById("error_confirm_pwd")
      if (password !== confirm) {
        errorConfirmPWD.style.display = 'block'
        document.getElementById("password").style.borderColor = "red";
document.getElementById("confirmPWD").style.borderColor = "red";
        return; // หยุดการดำเนินการที่เหลือในกรณีที่รหัสผ่านไม่ตรงกัน
    }
    

      // 회원가입 처리
      fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert(
              "Registration successful. Please Wait for admin verification your account."
            );
            // closePopup();
            window.location.reload()
          } else {
            alert(data.message || "Registration failed. Please try again.");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred. Please try again.");
        });
    } else {

      // 로그인 처리 (기존 코드)
      fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert("Login successful");
            location.reload();
          } else {
            alert(data.message || "Login failed. Please try again.");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred. Please try again.");
        });
    }
  });
