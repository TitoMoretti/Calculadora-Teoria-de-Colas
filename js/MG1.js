document.addEventListener("DOMContentLoaded", () => {
  //Obtener los elementos (etiquetas)
  const elements = {
    inputs: {
      lambda: document.getElementById("arriboIdN"),
      mu: document.getElementById("servicioIdN_mu"),
      es: document.getElementById("servicioIdN_es"),
      sigma: document.getElementById("desvioIdN"),
    },
    submitButton: document.getElementById("submitIdN"),
    resultsContainer: document.getElementById("resultsN"),
  };

  //Utilidades
  //Sanitización de entradas (eliminar caracteres no numéricos)
  function sanitizeInput(value) {
    return value.replace(/[^0-9.]/g, "");
  }
  //Mostrar y ocultar errores
  function showError(inputId, message) {
    const errorElement = document.getElementById(`error-${inputId}`);
    const inputElement = document.getElementById(inputId);
    errorElement.textContent = message;
    errorElement.style.display = "block";
    inputElement.classList.add("error");
    return false;
  }
  function clearError(inputId) {
    const errorElement = document.getElementById(`error-${inputId}`);
    const inputElement = document.getElementById(inputId);
    errorElement.style.display = "none";
    inputElement.classList.remove("error");
    return true;
  }
  //Validación de entradas
  function validateInput(value, inputId) {
    //Validación especial para los campos de tasa de servicio y esperanza matemática
    if (
      inputId === elements.inputs.mu.id ||
      inputId === elements.inputs.es.id
    ) {
      const muVal = elements.inputs.mu.value.trim();
      const esVal = elements.inputs.es.value.trim();
      if (!muVal && !esVal) {
        showError(elements.inputs.mu.id, "Ingrese μ o E(S)");
        showError(elements.inputs.es.id, "Ingrese E(S) o μ");
        return false;
      }
      if (muVal || esVal) {
        clearError(elements.inputs.mu.id);
        clearError(elements.inputs.es.id);
      }
      if (!value.trim() && (muVal || esVal)) {
        return true;
      }
    }
    if (!value.trim()) {
      return showError(inputId, "Este campo es requerido");
    }
    const sanitizedValue = sanitizeInput(value);
    if (sanitizedValue !== value) {
      document.getElementById(inputId).value = sanitizedValue;
    }
    const numValue = parseFloat(sanitizedValue);
    if (isNaN(numValue)) {
      return showError(inputId, "Debe ser un número válido");
    }
    if (numValue <= 0) {
      return showError(inputId, "Debe ser mayor que cero");
    }
    if (sanitizedValue.split(".")[1]?.length > 4) {
      return showError(inputId, "Máximo 4 decimales permitidos");
    }
    return clearError(inputId);
  }

  //Cálculos
  function calculateMG1(lambda, mu, es, sigma) {
    if (!mu && es) {
      //Tasa de servicio
      mu = 1 / es;
    }
    if (!es && mu) {
      //Esperanza matemática del tiempo de servicio
      es = 1 / mu;
    }
    //Utilización del sistema
    const rho = lambda / mu;
    //Esperanza matemática del número de clientes en el sistema
    const en = (rho / (1 - rho)) * (1 - (rho / 2) * (1 - Math.pow(mu, 2) * Math.pow(sigma, 2)));
    //Esperanza matemática del tiempo de permanencia en el sistema
    const et = (1 / (mu * (1 - rho))) * (1 - (rho / 2) * (1 - Math.pow(mu, 2) * Math.pow(sigma, 2)));
    //Varianza del tiempo de servicio
    const varianza = Math.pow(sigma, 2);

    return { mu, es, rho, en, et, varianza };
  }

  //Limpiar resultados
  function clearResults() {
    [
      "result-muN",
      "result-esN",
      "result-rhoN",
      "result-enN",
      "result-etN",
      "result-varN",
    ].forEach((id) => {
      document.getElementById(id).textContent = "";
    });
    elements.resultsContainer.style.display = "none";
  }

  //Mostrar resultados
  function displayResults(results) {
    //Formato de números (redondeo a 4 decimales)
    const formatNumber = (num, isInfinity) => {
      if (isInfinity) return "∞";
      if (isNaN(num) || !isFinite(num)) return "Error";
      return num.toFixed(4);
    };
    //Validar si el sistema es inestable
    const isInfinity = results.rho === 1;
    //Mostrar resultados
    document.getElementById("result-muN").textContent = formatNumber(
      results.mu,
      false,
    );
    document.getElementById("result-esN").textContent = formatNumber(
      results.es,
      false,
    );
    document.getElementById("result-rhoN").textContent = formatNumber(
      results.rho,
      false,
    );
    document.getElementById("result-enN").textContent = formatNumber(
      results.en,
      isInfinity,
    );
    document.getElementById("result-etN").textContent = formatNumber(
      results.et,
      isInfinity,
    );
    document.getElementById("result-varN").textContent = formatNumber(
      results.varianza,
      false,
    );
    elements.resultsContainer.style.display = "block";
  }

  //Validación (en tiempo real)
  Object.entries(elements.inputs).forEach(([key, input]) => {
    if (input) {
      input.addEventListener("input", () => {
        validateInput(input.value, input.id);
      });
    }
  });

  //Deshabilitar el otro campo cuando uno se edita, y mostrar mensaje de ayuda
  const muOriginalPlaceholder = elements.inputs.mu.placeholder;
  const esOriginalPlaceholder = elements.inputs.es.placeholder;
  elements.inputs.mu.addEventListener("input", () => {
    if (elements.inputs.mu.value.trim() !== "") {
      elements.inputs.es.value = "";
      elements.inputs.es.disabled = true;
      elements.inputs.es.placeholder =
        "Elimine la tasa de servicio para modificar";
    } else {
      elements.inputs.es.disabled = false;
      elements.inputs.es.placeholder = esOriginalPlaceholder;
    }
  });
  elements.inputs.es.addEventListener("input", () => {
    if (elements.inputs.es.value.trim() !== "") {
      elements.inputs.mu.value = "";
      elements.inputs.mu.disabled = true;
      elements.inputs.mu.placeholder =
        "Elimine la esperanza matemática para modificar";
    } else {
      elements.inputs.mu.disabled = false;
      elements.inputs.mu.placeholder = muOriginalPlaceholder;
    }
  });

  //Botón de cálculo
  elements.submitButton.addEventListener("click", () => {
    try {
      //Limpiar resultados anteriores
      clearResults();
      //Validar si todas las entradas son válidas
      const isValid = Object.entries(elements.inputs).every(([key, input]) =>
        validateInput(input.value, input.id),
      );
      if (!isValid) return;
      //Obtener los valores de las entradas
      const lambda = parseFloat(elements.inputs.lambda.value);
      let mu = parseFloat(elements.inputs.mu.value);
      let es = parseFloat(elements.inputs.es.value);
      const sigma = parseFloat(elements.inputs.sigma.value);
      if (isNaN(mu)) mu = undefined;
      if (isNaN(es)) es = undefined;
      //Calcular los resultados
      const results = calculateMG1(lambda, mu, es, sigma);
      //Mostrar los resultados
      displayResults(results);
    } catch (error) {
      showError("submitIdN", error.message);
    }
  });
});
