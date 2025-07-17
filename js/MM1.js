document.addEventListener("DOMContentLoaded", () => {
  //Cargar los elementos (etiquetas)
  const elements = {
    inputs: {
      arribo: document.getElementById("arriboId"),
      servicio: document.getElementById("servicioId"),
      poblacion: document.getElementById("poblacionId"),
    },
    submitButton: document.getElementById("submitId"),
    resultsContainer: document.getElementById("results"),
    loadingIndicator: document.createElement("div"),
  };

  //Crear el indicador de carga
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
  //Formatear números a 4 decimales o infinito o error
  function formatNumber(num, isInfinity) {
    if (isInfinity) return "∞";
    if (isNaN(num) || !isFinite(num)) {
      return "Error";
    }
    return num.toFixed(4);
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
  //Actualizar encabezados de las probabilidades
  function updateHeaders(N) {
    document.querySelectorAll("h4").forEach((h4) => {
      if (h4.textContent.includes("al menos")) {
        h4.innerHTML = `Probabilidad de que haya en el sistema <b>al menos</b> <span id='result-n'>${N ?? ""}</span> clientes:`;
      }
      if (h4.textContent.includes("como máximo")) {
        h4.innerHTML = `Probabilidad de que haya en el sistema <b>como máximo</b> <span id='result-n'>${N ?? ""}</span> clientes:`;
      }
    });
  }
  //Mostrar y ocultar el estado de carga
  function setLoading(isLoading) {
    elements.loadingIndicator.style.display = isLoading ? "block" : "none";
    elements.submitButton.disabled = isLoading;
  }
  //Validar si N existe
  function isValidN(N) {
    return N !== undefined && N !== null && N !== "" && !isNaN(N);
  }

  //Validación de entradas
  function validateInput(value, inputId) {
    //Sanitizar el valor de la entrada
    const sanitizedValue = sanitizeInput(value);
    if (sanitizedValue !== value) {
      document.getElementById(inputId).value = sanitizedValue;
    }
    //Validación de la población
    if (inputId === "poblacionId") {
      if (!value.trim()) {
        clearError(inputId);
        return true;
      }
      const numValue = parseFloat(sanitizedValue);
      if (isNaN(numValue) || numValue < 0) {
        return showError(
          inputId,
          "Debe ser un número válido mayor o igual a cero",
        );
      }
      if (sanitizedValue.split(".")[1]?.length > 4) {
        return showError(inputId, "Máximo 4 decimales permitidos");
      }
      return clearError(inputId);
    }
    //Validación de las tasas de arribo y servicio
    else {
      if (!value.trim()) {
        return showError(inputId, "Este campo es requerido");
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
      if (inputId === "arriboId") {
        const serviceRate = parseFloat(elements.inputs.servicio.value);
        if (serviceRate && numValue >= serviceRate) {
          return showError(
            inputId,
            "La tasa de arribo debe ser menor que la tasa de servicio. De lo contrario, el sistema será inestable (ρ ≥ 1), produciendo congestionamiento y resultados inválidos o infinitos.",
          );
        }
      }
      if (inputId === "servicioId") {
        const arrivalRate = parseFloat(elements.inputs.arribo.value);
        if (arrivalRate && numValue <= arrivalRate) {
          return showError(
            inputId,
            "La tasa de servicio debe ser mayor que la tasa de arribo. De lo contrario, el sistema será inestable (ρ ≥ 1), produciendo congestionamiento y resultados inválidos o infinitos.",
          );
        }
      }
      return clearError(inputId);
    }
  }

  //Función para calcular los resultados
  function calculateMM1(λ, μ, N) {
    try {
      //Utilización del sistema
      const rho = λ / μ;
      //Validar probabilidad
      if (rho >= 1) {
        rho = rho + " (Sistema Inestable)";
      }
      //Tiempo entre llegadas
      const tllegada = 1 / λ;
      //Tiempo medio de servicio
      const ts = 1 / μ;
      //Probabilidad de no clientes en el sistema
      const p0 = 1 - rho;
      //Número promedio de clientes en la cola
      const lq = (λ * λ) / (μ * (μ - λ));
      //Número promedio de clientes en el sistema
      const l = λ / (μ - λ);
      //Tiempo promedio de espera en la cola
      const wq = λ / (μ * (μ - λ));
      //Tiempo promedio en el sistema
      const w = l / (μ - λ);
      //Probabilidad de N clientes en el sistema
      const pn = p0 * Math.pow(rho, N);
      // Probabilidad de al menos N clientes en el sistema - Cálculo de los primeros tres valores de la sumatoria
      const pN = p0 * Math.pow(rho, N);
      const pN1 = p0 * Math.pow(rho, N + 1);
      const pN2 = p0 * Math.pow(rho, N + 2);
      // Probabilidad de como máximo N clientes en el sistema
      let sumAtMostN = 0;
      for (let n = 0; n <= N; n++) {
        sumAtMostN += p0 * Math.pow(rho, n);
      }
      const pAtMostN = sumAtMostN;

      return { rho, tllegada, ts, p0, lq, l, wq, w, pn, pAtMostN, pN, pN1, pN2 };
    } catch (error) {
      throw new Error(`Error en el cálculo: ${error.message}`);
    }
  }

  //Limpiar resultados
  function clearResults() {
    const resultElements = [
      "result-rho",
      "result-tllegada",
      "result-ts",
      "result-p0",
      "result-lq",
      "result-l",
      "result-wq",
      "result-w",
      "result-n",
      "result-pn",
      "result-pn-at-least",
      "result-pn-at-most",
    ];
    resultElements.forEach((id) => {
      document.getElementById(id).textContent = "";
    });
    elements.resultsContainer.style.display = "none";
  }

  //Mostrar resultados con manejo de errores
  function displayResults(results, N) {
    try {
      //Limpiar resultados anteriores
      clearResults();
      //Validar si el sistema es inestable
      const isInfinity = results.rho === 1;
      //Mostrar resultados
      document.getElementById("result-rho").textContent = formatNumber(
        results.rho,
        false,
      );
      document.getElementById("result-tllegada").textContent = formatNumber(
        results.tllegada,
        false,
      );
      document.getElementById("result-ts").textContent = formatNumber(
        results.ts,
        false,
      );
      document.getElementById("result-p0").textContent =
        `${formatNumber(results.p0, false)} = ${(results.p0 * 100).toFixed(2)}%`;
      document.getElementById("result-lq").textContent = formatNumber(
        results.lq,
        isInfinity,
      );
      document.getElementById("result-l").textContent = formatNumber(
        results.l,
        isInfinity,
      );
      document.getElementById("result-wq").textContent = formatNumber(
        results.wq,
        isInfinity,
      );
      document.getElementById("result-w").textContent = formatNumber(
        results.w,
        isInfinity,
      );

      //Mostrar probabilidades relacionadas con N solo si N existe
      if (isValidN(N)) {
        document.getElementById("result-n").textContent = N;
        updateHeaders(N);
        document.getElementById("result-pn").textContent =
          `${formatNumber(results.pn, false)} = ${(results.pn * 100).toFixed(2)}%`;
        document.getElementById("result-pn-at-least").innerHTML =
          `$$P(\\geq ${N}) = P_{${N}} + P_{${Number(N) + 1}} + P_{${Number(N) + 2}} + \\ldots + P_{\\infty} = ${formatNumber(results.pN, false)} + ${formatNumber(results.pN1, false)} + ${formatNumber(results.pN2, false)} + \\ldots + P_{\\infty}$$`;
        document.getElementById("result-pn-at-most").textContent =
          `${formatNumber(results.pAtMostN, false)} = ${(results.pAtMostN * 100).toFixed(2)}%`;
        if (window.MathJax) {
          MathJax.typesetPromise();
        }
      } else {
        document.getElementById("result-n").textContent = "";
        updateHeaders("");
        document.getElementById("result-pn").textContent = "";
        document.getElementById("result-pn-at-least").textContent = "";
        document.getElementById("result-pn-at-most").textContent = "";
      }
      elements.resultsContainer.style.display = "block";
    } catch (error) {
      showError("submitId", `Error al mostrar resultados: ${error.message}`);
    }
  }

  //Agregar eventos de entrada con debounce (evitar que se ejecute la función demasiadas veces)
  let debounceTimer;
  Object.entries(elements.inputs).forEach(([key, input]) => {
    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        validateInput(input.value, input.id);
      }, 300);
    });
  });

  //Iniciar el cálculo
  elements.submitButton.addEventListener("click", async () => {
    try {
      clearResults();
      //Validar todas las entradas
      const isValid = Object.entries(elements.inputs).every(([key, input]) =>
        validateInput(input.value, input.id),
      );
      if (isValid) {
        setLoading(true);
        //Obtener los valores de las entradas
        const λ = parseFloat(elements.inputs.arribo.value);
        const μ = parseFloat(elements.inputs.servicio.value);
        const N_raw = elements.inputs.poblacion.value;
        const N = N_raw.trim() === "" ? undefined : parseFloat(N_raw);
        //Calcular los resultados
        const results = calculateMM1(λ, μ, N);
        //Mostrar los resultados
        displayResults(results, N);
      }
    } catch (error) {
      showError("submitId", error.message);
    } finally {
      setLoading(false);
    }
  });
});
