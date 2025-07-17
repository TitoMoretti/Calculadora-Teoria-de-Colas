document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    inputs: {
      arribo: document.getElementById("arriboIdN"),
      servicio: document.getElementById("servicioIdN"),
      poblacion: document.getElementById("poblacionIdN"),
      nclientes: document.getElementById("nClientesIdN"),
    },
    submitButton: document.getElementById("submitIdN"),
    resultsContainer: document.getElementById("resultsN"),
    loadingIndicator: document.createElement("div"),
  };

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
    if (isInfinity) return "∞";
    if (isNaN(num) || !isFinite(num)) return "Error";
    return num.toFixed(4);
  }
  //Formatear números a porcentaje
  function formatPercent(num, isInfinity) {
    if (isInfinity) return "∞";
    if (isNaN(num) || !isFinite(num)) return "Error";
    return (num * 100).toFixed(2) + "%";
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
  //Mostrar y ocultar el estado de carga
  function setLoading(isLoading) {
    elements.loadingIndicator.style.display = isLoading ? "block" : "none";
    elements.submitButton.disabled = isLoading;
  }
  //Validar si N existe
  function isValidN(N) {
    return (
      N !== undefined &&
      N !== null &&
      N !== "" &&
      !isNaN(N) &&
      Number.isInteger(N) &&
      N >= 0
    );
  }
  //Validar si n existe
  function isValidn(n, N) {
    return (
      n !== undefined &&
      n !== null &&
      n !== "" &&
      !isNaN(n) &&
      Number.isInteger(n) &&
      n >= 0 &&
      (!isNaN(N) ? n <= N : true)
    );
  }

  //Validación de entradas
  function validateInput(value, inputId, N) {
    //Primero preparamos el valor de la entrada
    const sanitizedValue = sanitizeInput(value);
    if (sanitizedValue !== value) {
      document.getElementById(inputId).value = sanitizedValue;
    }
    if (!value.trim()) {
      if (inputId === "nClientesIdN") {
        clearError(inputId);
        return true;
      }
      return showError(inputId, "Este campo es requerido");
    }
    const numValue = parseFloat(sanitizedValue);
    if (isNaN(numValue)) {
      return showError(inputId, "Debe ser un número válido");
    }
    if (numValue < 0) {
      return showError(inputId, "Debe ser mayor o igual a cero");
    }
    if (inputId === "arriboIdN" || inputId === "servicioIdN") {
      if (numValue <= 0) {
        return showError(inputId, "Debe ser mayor que cero");
      }
    }
    if (inputId === "nClientesIdN") {
      const Nval = isValidN(N) ? N : parseInt(elements.inputs.poblacion.value);
      if (!Number.isInteger(numValue)) {
        return showError(inputId, "Debe ser un número entero");
      }
      if (isValidN(Nval) && (numValue < 0 || numValue > Nval)) {
        return showError(
          inputId,
          `Debe estar entre 0 y la capacidad máxima del sistema (${Nval})`,
        );
      }
    }
    if (sanitizedValue.split(".")[1]?.length > 4) {
      return showError(inputId, "Máximo 4 decimales permitidos");
    }
    return clearError(inputId);
  }

  //Obtener valores de las entradas
  function getInputs() {
    const λ = parseFloat(elements.inputs.arribo.value);
    const μ = parseFloat(elements.inputs.servicio.value);
    const N = parseInt(elements.inputs.poblacion.value);
    let nInput = elements.inputs.nclientes.value.trim();
    let n = nInput !== "" ? parseInt(nInput) : undefined;
    return { λ, μ, N, n, nInput };
  }

  function calculateMM1N(λ, μ, N, n) {
    //Utilización del sistema
    const rho = λ / μ;
    let P0, PB, tau, lambdaE, Ls, LQ, Ws, WQ, pn;
    //Probabilidad del sistema vacío
    P0 = (1 - rho) / (1 - Math.pow(rho, N + 1));
    //Probabilidad de bloqueo
    PB = (Math.pow(rho, N) * (1 - rho)) / (1 - Math.pow(rho, N + 1));
    if (rho === 1) {
      //Número promedio de clientes en el sistema
      Ls = N / 2;
      //Número promedio de clientes en la cola
      LQ = (N * (N - 1)) / (2 * (N + 1));
    } else {
      //Número promedio de clientes en el sistema
      Ls = (rho / (1 - rho)) - (((N + 1) * Math.pow(rho, N + 1)) / (1 - Math.pow(rho, N + 1)));
      //Número promedio de clientes en la cola
      LQ = Ls - (((1 - Math.pow(rho, N)) * rho) / (1 - Math.pow(rho, N + 1)));
    }
    //Tasa de rechazos
    tau = λ * PB;
    //Tasa de llegada efectiva
    lambdaE = λ * (1 - PB);
    //Tiempo promedio en el sistema
    Ws = Ls / λ;
    //Tiempo promedio en la cola
    WQ = LQ / λ;
    //Probabilidad de N clientes en el sistema
    pn = (Math.pow(rho, n) * (1 - rho)) / (1 - Math.pow(rho, N + 1));
    //Utilización efectiva del sistema
    const rhoE = lambdaE / μ;
    //Número promedio de clientes en cola para un sistema ocupado
    const lb = LQ / (1 - P0);
    //Tiempo promedio de clientes en cola para un sistema ocupado
    const wb = WQ / (1 - P0);
    // Rendimiento a la Entrada
    const gammaI = λ * (1 - PB);
    // Rendimiento a la Salida
    const gammaO = μ * (1 - P0);

    return {
      rho,
      P0,
      PB,
      tau,
      lambdaE,
      Ls,
      LQ,
      Ws,
      WQ,
      pn,
      rhoE,
      lb,
      wb,
      gammaI,
      gammaO,
    };
  }

  //Limpiar resultados
  function clearResults() {
    [
      "result-rhoN",
      "result-p0N",
      "result-pbN",
      "result-tauN",
      "result-lambdaEN",
      "result-lsN",
      "result-lqN",
      "result-wsN",
      "result-wqN",
      "result-rhoEN",
      "result-lbN",
      "result-wbN",
      "result-pnN",
      "result-nN",
      "result-gammaIN",
      "result-gammaON",
    ].forEach((id) => {
      document.getElementById(id).textContent = "";
    });
    elements.resultsContainer.style.display = "none";
  }

  //Mostrar resultados
  function displayResults(results, n, nInput, N) {
    //Validar si el sistema es inestable
    const isInfinity = results.rho === 1;
    //Mostrar resultados
    document.getElementById("result-rhoN").textContent = formatNumber(
      results.rho,
      false,
    );
    document.getElementById("result-p0N").textContent =
      `${formatNumber(results.P0, false)} = ${formatPercent(results.P0, false)}`;
    document.getElementById("result-pbN").textContent =
      `${formatNumber(results.PB, false)} = ${formatPercent(results.PB, false)}`;
    document.getElementById("result-tauN").textContent = formatNumber(
      results.tau,
      false,
    );
    document.getElementById("result-lambdaEN").textContent = formatNumber(
      results.lambdaE,
      false,
    );
    document.getElementById("result-lsN").textContent = formatNumber(
      results.Ls,
      isInfinity,
    );
    document.getElementById("result-lqN").textContent = formatNumber(
      results.LQ,
      isInfinity,
    );
    document.getElementById("result-wsN").textContent = formatNumber(
      results.Ws,
      isInfinity,
    );
    document.getElementById("result-wqN").textContent = formatNumber(
      results.WQ,
      isInfinity,
    );
    document.getElementById("result-rhoEN").textContent = formatNumber(
      results.rhoE,
      false,
    );
    document.getElementById("result-gammaIN").textContent = formatNumber(
      results.gammaI,
      false,
    );
    document.getElementById("result-gammaON").textContent = formatNumber(
      results.gammaO,
      false,
    );
    document.getElementById("result-lbN").textContent = formatNumber(
      results.lb,
      isInfinity,
    );
    document.getElementById("result-wbN").textContent = formatNumber(
      results.wb,
      isInfinity,
    );
    if (isValidn(n, N)) {
      document.getElementById("result-nN").textContent = n;
      document.getElementById("result-pnN").textContent =
        `${formatNumber(results.pn, false)} = ${formatPercent(results.pn, false)}`;
    } else {
      document.getElementById("result-nN").textContent = "";
      document.getElementById("result-pnN").textContent = "";
    }
    elements.resultsContainer.style.display = "block";
  }

  //Debounce y eventos (evitar que se ejecute la función demasiadas veces)
  let debounceTimer;
  Object.entries(elements.inputs).forEach(([key, input]) => {
    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const { N } = getInputs();
        validateInput(input.value, input.id, N);
      }, 300);
    });
  });

  //Botón de calcular
  elements.submitButton.addEventListener("click", async () => {
    try {
      clearResults();
      const { λ, μ, N, n, nInput } = getInputs();
      //Validar todas las entradas
      const isValid = Object.entries(elements.inputs).every(([key, input]) =>
        validateInput(input.value, input.id, N),
      );
      //Si todas las entradas son válidas, calcular los resultados
      if (isValid) {
        setLoading(true);
        //Calcular los resultados
        const results = calculateMM1N(λ, μ, N, n);
        //Mostrar los resultados
        displayResults(results, n, nInput, N);
      }
    } catch (error) {
      showError("submitIdN", error.message);
    } finally {
      setLoading(false);
    }
  });
});
