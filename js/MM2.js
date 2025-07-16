document.addEventListener("DOMContentLoaded", () => {
  //Elementos del DOM
  const elements = {
    inputs: {
      arribo: document.getElementById("arriboId"),
      servicio1: document.getElementById("servicio1Id"),
      servicio2: document.getElementById("servicio2Id"),
      clientes: document.getElementById("clientesId"),
    },
    submitButton: document.getElementById("submitId"),
    resultsContainer: document.getElementById("results"),
    equalServersSection: document.querySelector(".results-section"),
    differentServersSection: document.getElementById(
      "different-servers-section",
    ),
    loadingIndicator: document.createElement("div"),
  };

  //Indicador de carga
  elements.loadingIndicator.className = "loading-indicator";
  elements.loadingIndicator.style.display = "none";
  elements.submitButton.parentNode.insertBefore(
    elements.loadingIndicator,
    elements.submitButton,
  );

  //Utilidades
  //Sanitización de entradas (eliminar caracteres no numéricos)
  function sanitizeInput(value) {
    return value.replace(/[^0-9.]/g, "");
  }
  //Formatear números a 4 decimales
  function formatNumber(num, isInfinity) {
    if (isInfinity) {
      return "∞";
    }
    if (isNaN(num) || !isFinite(num)) {
      return "Error";
    }
    return num.toFixed(4);
  }
  //Formatear números a porcentaje
  function formatPercentage(value, isInfinity) {
    if (isInfinity) {
      return "∞";
    }
    return `${formatNumber(value, false)} = ${(value * 100).toFixed(2)}%`;
  }
  //Mostrar y ocultar errores
  function showError(inputId, message) {
    const errorElement = document.getElementById(`error-${inputId}`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
      const inputElement = document.getElementById(inputId);
      if (inputElement) {
        inputElement.classList.add("error");
      }
    }
    return false;
  }
  function clearError(inputId) {
    const errorElement = document.getElementById(`error-${inputId}`);
    if (errorElement) {
      errorElement.style.display = "none";
      const inputElement = document.getElementById(inputId);
      if (inputElement) {
        inputElement.classList.remove("error");
      }
    }
    return true;
  }
  //Validación de entradas
  function validateInput(value, inputId) {
    if (inputId === "clientesId") {
      if (!value.trim()) {
        return clearError(inputId);
      }
    } else {
      if (!value.trim()) {
        return showError(inputId, "Este campo es requerido");
      }
    }
    //Llamada a la función de sanitización
    const sanitizedValue = sanitizeInput(value);
    if (sanitizedValue !== value) {
      const inputElement = document.getElementById(inputId);
      if (inputElement) {
        inputElement.value = sanitizedValue;
      }
    }
    //Obtener el valor numérico de la entrada
    const numValue = parseFloat(sanitizedValue);
    //Validar si el valor es un número válido
    if (inputId !== "clientesId") {
      if (isNaN(numValue)) {
        return showError(inputId, "Debe ser un número válido");
      }
      if (numValue <= 0) {
        return showError(inputId, "Debe ser mayor que cero");
      }
    } else {
      if (value.trim() && (isNaN(numValue) || numValue < 0)) {
        return showError(
          inputId,
          "Debe ser un número válido mayor o igual a cero",
        );
      }
    }
    //Validar si el valor tiene más de 4 decimales
    if (sanitizedValue.split(".")[1]?.length > 4) {
      return showError(inputId, "Máximo 4 decimales permitidos");
    }

    if (inputId === "arriboId") {
      const service1Rate = parseFloat(elements.inputs.servicio1.value);
      const service2Rate = parseFloat(elements.inputs.servicio2.value);
      /*if (service1Rate && service2Rate && numValue >= (service1Rate + service2Rate)) {
                return showError(inputId, 'La tasa de arribo debe ser menor que la suma de las tasas de servicio');
            }*/
    }

    return clearError(inputId);
  }

  function calculateMM2General(λ, μ1, μ2, n) {
    //Tasa de servicio total
    const μs = μ1 + μ2;
    //Utilización del sistema
    const ρ = λ / μs;
    //Longitud promedio del sistema
    const Ls = ρ / (1 - ρ);
    //Longitud promedio de la cola
    const LQ = Math.pow(ρ, 2) / (1 - ρ);
    //Tiempo promedio en el sistema
    const Ws = Ls / λ;
    //Tiempo promedio en la cola
    const WQ = LQ / λ;
    //Probabilidad de N clientes en el sistema
    const pn = n !== undefined ? (1 - ρ) * Math.pow(ρ, n) : null;

    return { μs, ρ, Ls, LQ, Ws, WQ, pn };
  }

  //Cálculos para servidores a la misma velocidad
  function calculateMM2EqualServers(ρ, Ls) {
    //Probabilidad de que el sistema esté vacío
    const P0 = 1 - ρ;
    //Número promedio de clientes en el sistema (Teorema de Little)
    const N = Ls;
    return { P0, N };
  }

  //Cálculos para servidores a diferentes velocidades sin selección
  function calculateMM2NoSelection(λ, μ1, μ2, ρ) {
    //Relación entre las tasas de servicio
    const r = μ2 / μ1;
    //Umbral crítico de utilización
    const ρc = 1 - Math.pow((r * (1 + r)) / (1 + Math.pow(r, 2)), 0.5);
    //Factor de utilización
    const a = (2 * μ1 * μ2) / (μ1 + μ2);
    //Probabilidad del sistema vacío
    const π0 = (1 - ρ) / (1 - ρ + λ / a);
    //Número promedio de clientes en el sistema
    const N = λ / ((1 - ρ) * (λ + (1 - ρ) * a));
    //Tiempo promedio en el sistema
    const Ws = λ > 0 ? N / λ : NaN;

    return { ρc, π0, N, Ws };
  }

  //Cálculos para servidores a diferentes velocidades con selección
  function calculateMM2WithSelection(λ, μ1, μ2, ρ) {
    //Relación entre las tasas de servicio
    const r = μ2 / μ1;
    //Factor de utilización
    const a = 1 + Math.pow(r, 2);
    //Factor de utilización
    const b = -(2 + Math.pow(r, 2));
    //Factor de utilización
    const c = -(2 * r - 1) * (1 + r);
    //Discriminante
    const discriminant = Math.pow(b, 2) - 4 * a * c;
    //Umbral crítico de utilización
    const ρc = (-b + Math.sqrt(discriminant)) / (2 * a);
    //Tasa de servicio total
    const μ = μ1 + μ2;
    //Factor de utilización
    const aPrime = ((2 * λ + μ) * (μ1 * μ2)) / (μ * (λ + μ2));
    //Probabilidad del sistema vacío
    const π0 = (1 - ρ) / (1 - ρ + λ / aPrime);
    //Número promedio de clientes en el sistema
    const N = λ / ((1 - ρ) * (λ + (1 - ρ) * aPrime));
    //Tiempo promedio en el sistema
    const Ws = λ > 0 ? N / λ : NaN;

    return { ρc, π0, N, Ws };
  }

  //Mostrar resultados
  function displayResults(
    generalResults,
    equalResults,
    noSelectionResults,
    withSelectionResults,
    isEqualServers,
  ) {
    const isInfinity = generalResults.ρ === 1;
    document.getElementById("general-results").style.display = "block";
    document.getElementById("result-mu-s-general").textContent = formatNumber(
      generalResults.μs,
      false,
    );
    document.getElementById("result-rho-general").textContent = formatNumber(
      generalResults.ρ,
      false,
    );
    document.getElementById("result-Ls-general").textContent = formatNumber(
      generalResults.Ls,
      isInfinity,
    );
    document.getElementById("result-Lq-general").textContent = formatNumber(
      generalResults.LQ,
      isInfinity,
    );
    document.getElementById("result-Ws-general").textContent = formatNumber(
      generalResults.Ws,
      isInfinity,
    );
    document.getElementById("result-Wq-general").textContent = formatNumber(
      generalResults.WQ,
      isInfinity,
    );
    document.getElementById("result-pn-general").textContent =
      generalResults.pn !== null
        ? formatPercentage(generalResults.pn, isInfinity)
        : "";
    document.getElementById("result-n").textContent =
      (typeof generalResults.pn === "number" && !isNaN(generalResults.pn) && elements.inputs.clientes.value)
        ? elements.inputs.clientes.value
        : "";
    if (isEqualServers) {
      document.getElementById("equal-servers-results").style.display = "block";
      document.getElementById("different-servers-results").style.display =
        "none";
      document.getElementById("result-pi0-equal").textContent =
        formatPercentage(equalResults.P0, isInfinity);
      document.getElementById("result-N-equal").textContent = formatNumber(
        equalResults.N,
        isInfinity,
      );
    } else {
      document.getElementById("equal-servers-results").style.display = "none";
      document.getElementById("different-servers-results").style.display =
        "block";
      document.getElementById("result-rho-c-no-selection").textContent =
        formatNumber(noSelectionResults.ρc, false);
      document.getElementById("result-pi0-no-selection").textContent =
        formatPercentage(noSelectionResults.π0, isInfinity);
      document.getElementById("result-N-no-selection").textContent =
        formatNumber(noSelectionResults.N, isInfinity);
      document.getElementById("result-Ws-no-selection").textContent = formatNumber(noSelectionResults.Ws, isInfinity);
      document.getElementById("result-rho-c-selection").textContent =
        formatNumber(withSelectionResults.ρc, false);
      document.getElementById("result-pi0-selection").textContent =
        formatPercentage(withSelectionResults.π0, isInfinity);
      document.getElementById("result-N-selection").textContent = formatNumber(
        withSelectionResults.N,
        isInfinity,
      );
      document.getElementById("result-Ws-selection").textContent = formatNumber(
        withSelectionResults.Ws,
        isInfinity,
      );
    }
    elements.resultsContainer.style.display = "block";
    if (window.MathJax) {
      MathJax.typesetPromise();
    }
  }

  //Validación (en tiempo real)
  Object.keys(elements.inputs).forEach((key) => {
    const input = elements.inputs[key];
    if (input) {
      input.addEventListener("input", () => {
        validateInput(input.value, input.id);
      });
    }
  });

  //Botón de cálculo
  if (elements.submitButton) {
    elements.submitButton.addEventListener("click", () => {
      try {
        //Validación
        const isValid = Object.keys(elements.inputs).every((key) => {
          const input = elements.inputs[key];
          return input && validateInput(input.value, input.id);
        });

        if (!isValid) {
          throw new Error("Por favor, corrija los errores antes de calcular");
        }

        const λ = parseFloat(elements.inputs.arribo.value);
        const μ1 = parseFloat(elements.inputs.servicio1.value);
        const μ2 = parseFloat(elements.inputs.servicio2.value);
        const n = elements.inputs.clientes.value
          ? parseFloat(elements.inputs.clientes.value)
          : undefined;
        const isEqualServers = μ1 === μ2;

        //Indicador de carga
        elements.loadingIndicator.style.display = "block";

        //Cálculos generales
        const generalResults = calculateMM2General(λ, μ1, μ2, n);
        let equalResults = null;
        let noSelectionResults = null;
        let withSelectionResults = null;

        if (isEqualServers) {
          equalResults = calculateMM2EqualServers(
            generalResults.ρ,
            generalResults.Ls,
          );
        } else {
          noSelectionResults = calculateMM2NoSelection(
            λ,
            μ1,
            μ2,
            generalResults.ρ,
          );
          withSelectionResults = calculateMM2WithSelection(
            λ,
            μ1,
            μ2,
            generalResults.ρ,
          );
        }

        // Mostrar resultados
        displayResults(
          generalResults,
          equalResults,
          noSelectionResults,
          withSelectionResults,
          isEqualServers,
        );
      } catch (error) {
        console.error("Error en el cálculo:", error);
        showError("submitId", `Error en el cálculo: ${error.message}`);
      } finally {
        //Indicador de carga
        elements.loadingIndicator.style.display = "none";
      }
    });
  }
});
