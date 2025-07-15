document.addEventListener("DOMContentLoaded", () => {
  //Declaración de variables y etiquetas
  var menuButton = document.querySelector(".menu-button");
  var navLinks = document.querySelector(".nav-links");
  var modelMM1 = document.getElementsByClassName("model-MM1")[0];
  var modelMM1N = document.getElementsByClassName("model-MM1N")[0];
  var modelMM2 = document.getElementsByClassName("model-MM2")[0];
  var modelMG1 = document.getElementsByClassName("model-MG1")[0];
  var modelMD1 = document.getElementsByClassName("model-MD1")[0];

  menuButton.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
  //Cierra el menú al hacer clic fuera de él
  document.addEventListener("click", (event) => {
    var isClickInsideNav = event.target.closest(".nav-left");
    if (!isClickInsideNav && navLinks.classList.contains("active")) {
      navLinks.classList.remove("active");
    }
  });
  //Cerrar el menú al redimensionar la ventana
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && navLinks.classList.contains("active")) {
      navLinks.classList.remove("active");
    }
  });

  //Redirigir a la página de MM1 al hacer clic en el modelo
  if (modelMM1) {
    modelMM1.addEventListener("click", () => {
      window.location.href = "MM1.html";
    });
  }

  //Redirigir a la página de MM1N al hacer clic en el modelo
  if (modelMM1N) {
    modelMM1N.addEventListener("click", () => {
      window.location.href = "MM1N.html";
    });
  }

  //Redirigir a la página de MM2 al hacer clic en el modelo
  if (modelMM2) {
    modelMM2.addEventListener("click", () => {
      window.location.href = "MM2.html";
    });
  }

  //Redirigir a la página de MG1 al hacer clic en el modelo
  if (modelMG1) {
    modelMG1.addEventListener("click", () => {
      window.location.href = "MG1.html";
    });
  }

  //Redirigir a la página de MD1 al hacer clic en el modelo
  if (modelMD1) {
    modelMD1.addEventListener("click", () => {
      window.location.href = "MD1.html";
    });
  }
});
